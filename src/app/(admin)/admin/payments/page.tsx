import Link from "next/link";
import { Pencil, Filter } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { PageHeader, Card, Badge, EmptyState } from "@/components/admin/ui";
import { DeleteButton } from "@/components/admin/DeleteButton";
import {
  PAYMENT_STATUSES,
  statusLabel,
  statusBadgeTone,
  methodLabel,
  formatAmount,
  formatMinor,
  summarizeByCurrency,
  summarize,
  isPaymentStatus,
  DEFAULT_CURRENCY,
} from "@/lib/payments";
import { deletePayment } from "./actions";

const SELECT_CLASS =
  "rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-[13px] outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/15";

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; userId?: string }>;
}) {
  await requireUser();
  const sp = await searchParams;

  const status = isPaymentStatus(sp.status) ? sp.status : undefined;
  const userId = sp.userId && sp.userId !== "" ? sp.userId : undefined;

  const [students, payments] = await Promise.all([
    prisma.user.findMany({
      where: { role: "STUDENT" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, studentNo: true },
    }),
    prisma.payment.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(userId ? { userId } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true, studentNo: true } },
        enrollment: { select: { course: { select: { titleAr: true } } } },
      },
    }),
  ]);

  // المجاميع تتبع التصفية الظاهرة — رقمٌ لا يطابق الجدول أمامه يربك المدقّق.
  const byCurrency = summarizeByCurrency(payments);
  const totals = byCurrency.length > 0 ? byCurrency : [summarize([], DEFAULT_CURRENCY)];

  return (
    <div>
      <PageHeader
        title="الرسوم والمدفوعات"
        desc="سجلّ ماليّ يدويّ: تُدوَّن فيه الدفعات الواصلة والإعفاءات. لا بوّابة دفع في المنصّة."
        action={{ href: "/admin/payments/new", label: "تسجيل دفعة" }}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href="/admin/enrollments"
          className="rounded-lg border border-black/10 bg-white px-3.5 py-2 text-[12.5px] font-bold text-navy-700 hover:border-gold/50"
        >
          تسجيل الطلاب ←
        </Link>
        <Link
          href="/admin/students"
          className="rounded-lg border border-black/10 bg-white px-3.5 py-2 text-[12.5px] font-bold text-navy-700 hover:border-gold/50"
        >
          حسابات الطلاب ←
        </Link>
      </div>

      {/* بطاقات المجاميع — مفصولة بالعملة، والإعفاء خارج المحصَّل عمدًا. */}
      {totals.map((t) => (
        <div key={t.currency} className="mb-4 grid gap-3 sm:grid-cols-3">
          <SummaryCard
            label="إجمالي المحصَّل"
            value={formatMinor(t.collected, t.currency)}
            hint={`${t.counts.paid} دفعة مسدَّدة${
              t.refunded !== 0 ? ` · الصافي بعد الاستردادات ${formatMinor(t.net, t.currency)}` : ""
            }`}
            tone="green"
          />
          <SummaryCard
            label="قيد التأكيد"
            value={formatMinor(t.pending, t.currency)}
            hint={`${t.counts.pending} دفعة لم تُؤكَّد بعد`}
            tone="gray"
          />
          <SummaryCard
            label="الإعفاءات"
            value={formatMinor(t.waived, t.currency)}
            hint={`${t.counts.waived} إعفاء — للتوثيق لا للتحصيل، ولا يدخل المحصَّل`}
            tone="gold"
          />
        </div>
      ))}

      <form method="get" className="mb-5 flex flex-wrap items-center gap-2.5">
        <Filter size={16} className="text-ink-soft" />
        <select name="userId" defaultValue={userId ?? ""} className={SELECT_CLASS}>
          <option value="">كل الطلاب</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} · {s.studentNo ?? s.email}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={status ?? ""} className={SELECT_CLASS}>
          <option value="">كل الحالات</option>
          {PAYMENT_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.ar}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-[13px] font-bold text-navy-800 hover:border-gold/50"
        >
          تصفية
        </button>
        {(status || userId) && (
          <Link
            href="/admin/payments"
            className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-[13px] font-bold text-ink-soft hover:border-gold/50"
          >
            إلغاء التصفية
          </Link>
        )}
      </form>

      <Card>
        {payments.length === 0 ? (
          <EmptyState label="لا توجد دفعات مطابقة. اضغط «تسجيل دفعة»." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-[13.5px]">
              <thead>
                <tr className="border-b border-black/5 text-[12px] text-ink-soft">
                  <th className="px-4 py-3 font-bold">الطالب</th>
                  <th className="px-4 py-3 font-bold">المقرّر</th>
                  <th className="px-4 py-3 font-bold">المبلغ</th>
                  <th className="px-4 py-3 font-bold">الحالة</th>
                  <th className="px-4 py-3 font-bold">الطريقة</th>
                  <th className="px-4 py-3 font-bold">تاريخ السداد</th>
                  <th className="px-4 py-3 font-bold">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-black/5 last:border-0 hover:bg-cream-50">
                    <td className="px-4 py-3">
                      <div className="font-bold text-navy-900">{p.user.name}</div>
                      <div className="text-[12px] text-ink-soft" dir="ltr">
                        {p.user.studentNo ? `${p.user.studentNo} · ` : ""}
                        {p.user.email}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-navy-800">
                      {p.enrollment?.course.titleAr ?? (
                        <span className="text-ink-soft">غير منسوبة لمقرّر</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-bold text-navy-900">
                      {formatAmount(p.amount, p.currency)}
                      {p.status === "WAIVED" && (
                        <span className="block text-[11.5px] font-normal text-ink-soft">
                          للتوثيق فقط
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={statusBadgeTone(p.status)}>{statusLabel(p.status)}</Badge>
                    </td>
                    <td className="px-4 py-3 text-navy-800">{methodLabel(p.method)}</td>
                    <td className="px-4 py-3 text-ink-soft" dir="ltr">
                      {p.paidAt ? p.paidAt.toISOString().slice(0, 10) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/admin/payments/${p.id}`}
                          className="grid h-9 w-9 place-items-center rounded-lg text-navy-700 hover:bg-black/5"
                          title="تعديل"
                        >
                          <Pencil size={16} />
                        </Link>
                        <DeleteButton
                          action={deletePayment.bind(null, p.id)}
                          confirm="سيُحذف هذا القيد من السجلّ الماليّ نهائيًّا. هل أنت متأكد؟"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone: "green" | "gray" | "gold";
}) {
  const tones = {
    green: "text-emerald-700",
    gray: "text-navy-800",
    gold: "text-gold-3",
  } as const;
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <div className="text-[12px] font-bold text-ink-soft">{label}</div>
      <div className={`mt-1 text-[22px] font-extrabold ${tones[tone]}`}>{value}</div>
      <div className="mt-1 text-[11.5px] leading-5 text-ink-soft">{hint}</div>
    </div>
  );
}
