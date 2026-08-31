import Link from "next/link";
import { Filter, ScrollText, ShieldCheck, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { formatVerifyCode } from "@/lib/certificates";
import { PageHeader, Card, Badge, EmptyState } from "@/components/admin/ui";
import { formatDateTime } from "@/components/admin/datetime";
import { CERTIFICATE_KINDS, kindLabel, kindTone } from "./fields";

const SELECT_CLASS =
  "rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-[13px] outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/15";

export default async function CertificatesPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; userId?: string }>;
}) {
  await requireUser();
  const sp = await searchParams;

  const kind =
    sp.kind && CERTIFICATE_KINDS.some((k) => k.value === sp.kind) ? sp.kind : undefined;
  const userId = sp.userId && sp.userId !== "" ? sp.userId : undefined;

  const [holders, certificates] = await Promise.all([
    // قائمة التصفية تقتصر على من له وثيقةٌ فعلًا — أقصر وأنفع من كل الطلاب.
    prisma.user.findMany({
      where: { role: "STUDENT", certificates: { some: {} } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.certificate.findMany({
      where: {
        ...(kind ? { kind: kind as "CERTIFICATE" | "IJAZA" } : {}),
        ...(userId ? { userId } : {}),
      },
      orderBy: { issuedAt: "desc" },
      select: {
        id: true,
        kind: true,
        titleAr: true,
        titleEn: true,
        serial: true,
        verifyCode: true,
        issuedAt: true,
        revoked: true,
        user: { select: { name: true, studentNo: true } },
        course: { select: { titleAr: true } },
        stage: { select: { titleAr: true } },
      },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="الشهادات والإجازات المسنَدة"
        desc="وثائق الكلّية برقم توثيقٍ ورمز تحقّقٍ علنيّ. الوثيقة لا تُحذف — تُلغى ويبقى أثرها."
        action={{ href: "/admin/certificates/new", label: "إصدار وثيقة" }}
      />
      <div className="mb-5 flex justify-end"><Link href="/admin/certificates/batch" className="inline-flex items-center gap-2 rounded-xl bg-navy-800 px-4 py-2.5 text-[13px] font-extrabold text-white hover:bg-navy-700"><Users size={16}/> إصدار جماعي حسب المقرر</Link></div>

      <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-[12.5px] text-sky-900">
        <ShieldCheck size={16} className="mt-0.5 shrink-0" />
        <p className="font-semibold leading-6">
          رقم التوثيق ورمز التحقّق يُولَّدان آليًّا عند الإصدار ولا يُدخلان يدويًّا. صفحة التحقّق
          العلنيّة على <code dir="ltr">/verify.html</code> ولا تعرض من بيانات الطالب سوى اسمه.
        </p>
      </div>

      <form method="get" className="mb-5 flex flex-wrap items-center gap-2.5">
        <Filter size={16} className="text-ink-soft" />
        <select name="kind" defaultValue={kind ?? ""} className={SELECT_CLASS}>
          <option value="">كل الأنواع</option>
          {CERTIFICATE_KINDS.map((k) => (
            <option key={k.value} value={k.value}>
              {k.label}
            </option>
          ))}
        </select>
        <select name="userId" defaultValue={userId ?? ""} className={SELECT_CLASS}>
          <option value="">كل الطلاب</option>
          {holders.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-[13px] font-bold text-navy-800 hover:border-gold/50"
        >
          تصفية
        </button>
      </form>

      <Card>
        {certificates.length === 0 ? (
          <EmptyState label="لا وثائق مطابقة. اضغط «إصدار وثيقة»." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-[13.5px]">
              <thead>
                <tr className="border-b border-black/5 text-[12px] text-ink-soft">
                  <th className="px-4 py-3 font-bold">النوع</th>
                  <th className="px-4 py-3 font-bold">الطالب</th>
                  <th className="px-4 py-3 font-bold">العنوان</th>
                  <th className="px-4 py-3 font-bold">رقم التوثيق</th>
                  <th className="px-4 py-3 font-bold">رمز التحقّق</th>
                  <th className="px-4 py-3 font-bold">تاريخ الإصدار</th>
                  <th className="px-4 py-3 font-bold">الحالة</th>
                  <th className="px-4 py-3 font-bold">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {certificates.map((c) => (
                  <tr key={c.id} className="border-b border-black/5 last:border-0 hover:bg-cream-50">
                    <td className="px-4 py-3">
                      <Badge tone={kindTone(c.kind)}>{kindLabel(c.kind)}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-navy-900">{c.user.name}</div>
                      {c.user.studentNo && (
                        <div className="text-[12px] text-ink-soft" dir="ltr">
                          {c.user.studentNo}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-navy-900">{c.titleAr}</div>
                      <div className="text-[11.5px] text-ink-soft">
                        {c.course?.titleAr ?? c.stage?.titleAr ?? "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-[12px] text-navy-800" dir="ltr">
                        {c.serial}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-[12px] text-ink-soft" dir="ltr">
                        {formatVerifyCode(c.verifyCode)}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-navy-800">{formatDateTime(c.issuedAt)}</td>
                    <td className="px-4 py-3">
                      {c.revoked ? <Badge tone="red">ملغاة</Badge> : <Badge tone="green">سارية</Badge>}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/certificates/${c.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-bold text-navy-700 hover:bg-black/5"
                      >
                        <ScrollText size={15} /> الوثيقة
                      </Link>
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
