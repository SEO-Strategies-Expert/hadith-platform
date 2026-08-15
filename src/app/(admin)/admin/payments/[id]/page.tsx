import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { PageHeader, Card, Select, Field, TextArea } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import {
  statusOptions,
  methodOptions,
  feeOptionLabel,
  minorToPlain,
  toMinor,
  formatAmount,
} from "@/lib/payments";
import { updatePayment } from "../actions";
import { ConsistencyNote } from "../ConsistencyNote";

/** قيمة `datetime-local` بتوقيتٍ عالميّ — يطابق ما يقرؤه `parseDate` في الإجراء. */
function dtLocalValue(d: Date | null): string | undefined {
  return d ? d.toISOString().slice(0, 16) : undefined;
}

export default async function EditPaymentPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;

  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, studentNo: true } },
      enrollment: { select: { id: true } },
    },
  });
  if (!payment) notFound();

  // تسجيلات هذا الطالب وحده: الطالب لا يتغيّر بعد الإنشاء، فلا معنى لعرض غيرها.
  const enrollments = await prisma.enrollment.findMany({
    where: { userId: payment.userId },
    orderBy: { enrolledAt: "desc" },
    select: { id: true, feeOption: true, course: { select: { titleAr: true } } },
  });

  return (
    <div>
      <PageHeader
        title="تعديل الدفعة"
        desc={`${payment.user.name} — ${formatAmount(payment.amount, payment.currency)}`}
      />

      <Card className="max-w-3xl p-6">
        {/* الطالب ثابت: نقل مبلغٍ من ذمّةٍ إلى أخرى يفسد سجلَّين معًا. */}
        <div className="mb-5 grid gap-3 rounded-xl bg-cream-50 p-4 sm:grid-cols-2">
          <div>
            <div className="text-[11.5px] font-bold text-ink-soft">الطالب</div>
            <div className="text-[13.5px] font-bold text-navy-900">{payment.user.name}</div>
            <div className="text-[12px] text-ink-soft" dir="ltr">
              {payment.user.studentNo ? `${payment.user.studentNo} · ` : ""}
              {payment.user.email}
            </div>
          </div>
          <div>
            <div className="text-[11.5px] font-bold text-ink-soft">تاريخ القيد</div>
            <div className="text-[13.5px] font-bold text-navy-900" dir="ltr">
              {payment.createdAt.toISOString().slice(0, 10)}
            </div>
            {payment.provider && (
              <div className="text-[12px] text-ink-soft" dir="ltr">
                {payment.provider}
                {payment.providerRef ? ` · ${payment.providerRef}` : ""}
              </div>
            )}
          </div>
        </div>

        <ActionForm action={updatePayment.bind(null, id)} cancelHref="/admin/payments">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Select
                label="التسجيل (اختياريّ)"
                name="enrollmentId"
                defaultValue={payment.enrollment?.id ?? ""}
                options={[
                  { value: "", label: "— بلا نسبة إلى مقرّر —" },
                  ...enrollments.map((e) => ({
                    value: e.id,
                    label: `${e.course.titleAr} (${feeOptionLabel(e.feeOption)})`,
                  })),
                ]}
              />
            </div>

            <Field
              label="المبلغ"
              name="amount"
              required
              dir="ltr"
              // نصًّا لا رقمًا: `Decimal` لا يُمرَّر عبر `Number` كي لا تضيع منزلة.
              defaultValue={minorToPlain(toMinor(payment.amount))}
              hint="رقمٌ موجب بمنزلتين عشريّتين على الأكثر."
            />
            <Field label="العملة" name="currency" defaultValue={payment.currency} dir="ltr" />

            <Select
              label="الحالة"
              name="status"
              defaultValue={payment.status}
              options={statusOptions()}
            />
            <Select
              label="الطريقة"
              name="method"
              defaultValue={payment.method ?? ""}
              options={[{ value: "", label: "— غير محدَّدة —" }, ...methodOptions()]}
            />

            <div className="sm:col-span-2">
              <Field
                label="تاريخ السداد"
                name="paidAt"
                type="datetime-local"
                dir="ltr"
                defaultValue={dtLocalValue(payment.paidAt)}
                hint="يلزم للحالة «مسدَّدة» — إن تُرك فارغًا ضُبط على وقت الحفظ. التوقيت عالميّ (UTC)."
              />
            </div>

            <div className="sm:col-span-2">
              <TextArea label="ملاحظة" name="note" rows={3} defaultValue={payment.note} />
            </div>
          </div>

          <ConsistencyNote />
        </ActionForm>
      </Card>
    </div>
  );
}
