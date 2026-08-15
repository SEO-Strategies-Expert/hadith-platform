import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Ban, ScrollText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { formatVerifyCode, verifyPath } from "@/lib/certificates";
import { PageHeader, Card, Badge } from "@/components/admin/ui";
import { formatDateTime } from "@/components/admin/datetime";
import { kindLabel, kindTone } from "../fields";
import { revokeCertificate, restoreCertificate } from "../actions";
import { CopyVerifyLink } from "../CopyVerifyLink";
import { RevokeBox, RestoreBox } from "../RevokeBox";

function Row({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-black/5 py-2.5 last:border-0">
      <span className="shrink-0 text-[12.5px] font-bold text-navy-800">{label}</span>
      <span className="text-[12.5px] text-ink-soft" dir={ltr ? "ltr" : "auto"}>
        {value}
      </span>
    </div>
  );
}

export default async function CertificatePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ issued?: string; revoked?: string; restored?: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const flags = await searchParams;

  const cert = await prisma.certificate.findUnique({
    where: { id },
    select: {
      id: true,
      kind: true,
      titleAr: true,
      titleEn: true,
      serial: true,
      verifyCode: true,
      issuedAt: true,
      revoked: true,
      revokeNote: true,
      isnadAr: true,
      isnadEn: true,
      grantedByAr: true,
      grantedByEn: true,
      user: { select: { name: true, email: true, studentNo: true } },
      course: { select: { titleAr: true } },
      stage: { select: { titleAr: true } },
      issuedBy: { select: { name: true } },
    },
  });
  if (!cert) notFound();

  const arPath = verifyPath("ar", cert.verifyCode);
  const enPath = verifyPath("en", cert.verifyCode);

  return (
    <div>
      <PageHeader title={cert.titleAr} desc={`${kindLabel(cert.kind)} — ${cert.user.name}`} />

      <Link
        href="/admin/certificates"
        className="mb-5 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-navy-700 hover:text-gold-3"
      >
        <ArrowRight size={15} /> عودة إلى قائمة الوثائق
      </Link>

      {flags.issued === "1" && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] font-semibold text-emerald-800">
          أُصدرت الوثيقة. رقم التوثيق ورمز التحقّق أدناه — انسخ رابط التحقّق وشاركه مع الطالب.
        </div>
      )}
      {flags.revoked === "1" && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-700">
          أُلغيت الوثيقة. صفحة التحقّق العلنيّة تقول الآن إنّها ملغاة.
        </div>
      )}
      {flags.restored === "1" && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] font-semibold text-emerald-800">
          أُعيدت الوثيقة سارية، ومُحي أثر الإلغاء.
        </div>
      )}

      {cert.revoked && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5">
          <div className="flex items-center gap-2 text-[13.5px] font-extrabold text-red-700">
            <Ban size={16} /> هذه الوثيقة ملغاة
          </div>
          {cert.revokeNote && (
            <p className="mt-1.5 text-[12px] leading-6 text-red-700/90">
              سبب الإلغاء (داخليّ، لا يُعرض للعموم): {cert.revokeNote}
            </p>
          )}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid gap-5">
          <Card className="p-6">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge tone={kindTone(cert.kind)}>{kindLabel(cert.kind)}</Badge>
              {cert.revoked ? <Badge tone="red">ملغاة</Badge> : <Badge tone="green">سارية</Badge>}
            </div>

            <Row label="عنوان الوثيقة (عربي)" value={cert.titleAr} />
            <Row label="عنوان الوثيقة (إنجليزي)" value={cert.titleEn} ltr />
            <Row label="صاحب الوثيقة" value={cert.user.name} />
            <Row
              label="حساب الطالب"
              value={`${cert.user.studentNo ? cert.user.studentNo + " · " : ""}${cert.user.email}`}
              ltr
            />
            <Row label="المقرّر" value={cert.course?.titleAr ?? "—"} />
            <Row label="المرحلة" value={cert.stage?.titleAr ?? "—"} />
            <Row label="تاريخ الإصدار" value={formatDateTime(cert.issuedAt)} />
            <Row label="أصدرها" value={cert.issuedBy?.name ?? "—"} />
          </Card>

          {cert.kind === "IJAZA" && (
            <Card className="p-6">
              <div className="mb-3 flex items-center gap-2 text-[14px] font-extrabold text-navy-900">
                <ScrollText size={16} /> السند والمُجيز
              </div>
              <Row label="المُجيز (عربي)" value={cert.grantedByAr ?? "—"} />
              <Row label="المُجيز (إنجليزي)" value={cert.grantedByEn ?? "—"} ltr />
              <div className="mt-4">
                <div className="mb-1.5 text-[12.5px] font-bold text-navy-800">نصّ السند (عربي)</div>
                <p className="whitespace-pre-line rounded-xl bg-cream-50 px-4 py-3 text-[13px] leading-8 text-navy-900">
                  {cert.isnadAr ?? "—"}
                </p>
              </div>
              {cert.isnadEn && (
                <div className="mt-4">
                  <div className="mb-1.5 text-[12.5px] font-bold text-navy-800">نصّ السند (إنجليزي)</div>
                  <p
                    dir="ltr"
                    className="whitespace-pre-line rounded-xl bg-cream-50 px-4 py-3 text-[13px] leading-8 text-navy-900"
                  >
                    {cert.isnadEn}
                  </p>
                </div>
              )}
            </Card>
          )}

          <Card className="p-6">
            <h2 className="mb-1.5 text-[14px] font-extrabold text-navy-900">إجراءات الوثيقة</h2>
            <p className="mb-4 text-[11.5px] leading-6 text-ink-soft">
              الوثيقة لا تُحذف ولا تُحرَّر بعد إصدارها: رقم توثيقها قد طُبع عليها ورمز تحقّقها قد
              شُورك. ما يقع فيه خطأٌ يُلغى وتُصدَر وثيقةٌ جديدة.
            </p>
            {cert.revoked ? (
              <RestoreBox action={restoreCertificate.bind(null, cert.id)} />
            ) : (
              <RevokeBox action={revokeCertificate.bind(null, cert.id)} />
            )}
          </Card>
        </div>

        <Card className="h-fit p-5">
          <h2 className="mb-3 text-[14px] font-extrabold text-navy-900">التوثيق والتحقّق</h2>

          <div className="mb-3">
            <div className="mb-1 text-[12px] font-bold text-navy-800">رقم التوثيق</div>
            <code
              dir="ltr"
              className="block rounded-lg border border-black/10 bg-cream-50 px-3 py-2 text-[13px] font-bold text-navy-900"
            >
              {cert.serial}
            </code>
          </div>

          <div className="mb-4">
            <div className="mb-1 text-[12px] font-bold text-navy-800">رمز التحقّق</div>
            <code
              dir="ltr"
              className="block rounded-lg border border-gold/40 bg-gold/10 px-3 py-2 text-[14px] font-extrabold tracking-widest text-navy-900"
            >
              {formatVerifyCode(cert.verifyCode)}
            </code>
            <p className="mt-1.5 text-[11px] leading-5 text-ink-soft">
              مولَّدٌ عشوائيًّا ولا يُدخل يدويًّا. يُملى بلا التباس: لا يحوي 0 ولا O ولا 1 ولا I ولا L.
            </p>
          </div>

          <div className="mb-2 text-[12px] font-bold text-navy-800">رابط التحقّق (عربي)</div>
          <CopyVerifyLink path={arPath} />

          <div className="mb-2 mt-4 text-[12px] font-bold text-navy-800">رابط التحقّق (إنجليزي)</div>
          <CopyVerifyLink path={enPath} label="انسخ الرابط الإنجليزي" />
        </Card>
      </div>
    </div>
  );
}
