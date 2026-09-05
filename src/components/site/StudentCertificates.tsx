/**
 * قسم «شهاداتي وإجازاتي» في بوابة الطالب.
 *
 * الموقع يَعِد الطالب صراحةً بإجازاتٍ مسنَدةٍ «برقم توثيقٍ ورمز تحقُّقٍ قابلٍ
 * للمشاركة»، وهذا القسم هو موضع الوفاء بذلك: كلُّ وثيقةٍ ورقمُها ورمزُها
 * ورابطُ تحقّقها جاهزًا للنسخ.
 *
 * لا زرَّ نسخٍ بجافاسكربت هنا: رابط التحقّق يُعرض نصًّا ظاهرًا وينفتح في تبويبٍ
 * جديد، فيعمل القسم كبقيّة البوابة بلا اعتمادٍ على النصّ البرمجيّ.
 */
import Link from "next/link";
import type { Lang } from "@/lib/site-data";
import { longDate } from "@/lib/site-format";
import { siteHref } from "@/lib/site-links";
import { getStudentCertificates, formatVerifyCode, verifyPath } from "@/lib/certificates";
import { Pill } from "@/components/site/StudentPortalKit";
import { CertificatePreviewModal } from "@/components/site/CertificatePreviewModal";

const T = {
  ar: {
    heading: "شهاداتي وإجازاتي",
    lede: "وثائقك الصادرة عن الكلّية، ولكلٍّ منها رقمُ توثيقٍ ورمزُ تحقُّقٍ يُشارَك مع من شئت.",
    emptyTitle: "لم تصدر لك وثيقةٌ بعد",
    emptyBody:
      "تظهر هنا شهاداتُ إتمام مقرّراتك وإجازاتُك المسنَدة فور اعتمادها من الهيئة العلمية، ومعها رابطُ تحقّقٍ علنيٌّ يثبت صحّتها لمن تعرضها عليه.",
    browsePrograms: "البرامج الدراسيّة",
    kindCertificate: "شهادة إتمام",
    kindIjaza: "إجازة مسنَدة",
    revoked: "ملغاة",
    grantedBy: "المُجيز",
    serial: "رقم التوثيق",
    code: "رمز التحقّق",
    issuedAt: "تاريخ الإصدار",
    verify: "صفحة التحقّق",
    preview: "معاينة الشهادة",
    close: "إغلاق",
    download: "تنزيل الشهادة",
    print: "حفظ كـ PDF",
    revokedNote: "هذه الوثيقة ملغاة ولم تعد معتمدة. لمعرفة السبب راسِل الكلّية.",
  },
  en: {
    heading: "My certificates and licences",
    lede:
      "Your documents issued by the College. Each carries a documentation number and a verification code you may share with whomever you wish.",
    emptyTitle: "No document has been issued to you yet",
    emptyBody:
      "Your certificates of completion and your chained licences (ijāzāt) appear here as soon as the academic board approves them, each with a public verification link that proves it genuine to anyone you show it to.",
    browsePrograms: "Programmes",
    kindCertificate: "Certificate of completion",
    kindIjaza: "Chained licence (ijāza)",
    revoked: "Revoked",
    grantedBy: "Granted by",
    serial: "Documentation number",
    code: "Verification code",
    issuedAt: "Date of issue",
    verify: "Verification page",
    preview: "Preview certificate",
    close: "Close",
    download: "Download certificate",
    print: "Save as PDF",
    revokedNote:
      "This document has been revoked and is no longer recognised. Write to the College to learn why.",
  },
} as const;

export async function StudentCertificates({ lang, userId }: { lang: Lang; userId: string }) {
  const t = T[lang];
  const certificates = await getStudentCertificates(userId);

  const pick = (ar: string | null, en: string | null) =>
    (lang === "ar" ? ar : en) ?? (lang === "ar" ? en : ar) ?? "";

  return (
    <section className="inner-section white orn-cream student-certificates-section" id="my-certificates">
      <div className="container">
        <header className="section-cap reveal">
          <h2 className="thuluth">{t.heading}</h2>
          <p>{t.lede}</p>
        </header>

        {certificates.length === 0 ? (
          <div className="callout reveal">
            <h3>{t.emptyTitle}</h3>
            <p>{t.emptyBody}</p>
            <div className="page-actions" style={{ marginTop: 20 }}>
              <Link className="btn btn-gold" href={siteHref(lang, "programs.html")}>
                {t.browsePrograms}
              </Link>
            </div>
          </div>
        ) : (
          <div className="card-grid">
            {certificates.map((c) => {
              const related = pick(
                c.course?.titleAr ?? c.stage?.titleAr ?? null,
                c.course?.titleEn ?? c.stage?.titleEn ?? null
              );
              const href = verifyPath(lang, c.verifyCode);
              return (
                <article className="info-card reveal" key={c.id}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                    <Pill tone={c.kind === "IJAZA" ? "gold" : "navy"}>
                      {c.kind === "IJAZA" ? t.kindIjaza : t.kindCertificate}
                    </Pill>
                    {c.revoked && <Pill tone="muted">{t.revoked}</Pill>}
                  </div>

                  <h3>{pick(c.titleAr, c.titleEn)}</h3>
                  {related && <p style={{ margin: "0 0 4px", fontWeight: 700 }}>{related}</p>}
                  {c.kind === "IJAZA" && (c.grantedByAr || c.grantedByEn) && (
                    <p style={{ margin: "0 0 4px" }}>
                      {t.grantedBy}: {pick(c.grantedByAr, c.grantedByEn)}
                    </p>
                  )}

                  <div style={{ display: "grid", gap: 4, marginTop: 12, fontSize: 13.5 }}>
                    <span>
                      <b style={{ color: "#123159" }}>{t.serial}:</b>{" "}
                      <span dir="ltr">{c.serial}</span>
                    </span>
                    <span>
                      <b style={{ color: "#123159" }}>{t.code}:</b>{" "}
                      <span dir="ltr" style={{ letterSpacing: ".08em", fontWeight: 800 }}>
                        {formatVerifyCode(c.verifyCode)}
                      </span>
                    </span>
                    <span>
                      <b style={{ color: "#123159" }}>{t.issuedAt}:</b>{" "}
                      {longDate(c.issuedAt, lang, { arabicDigits: lang === "ar" })}
                    </span>
                  </div>

                  {c.revoked && (
                    <p style={{ marginTop: 12, fontWeight: 700, color: "#9b1c1c" }}>
                      {t.revokedNote}
                    </p>
                  )}

                  <div className="page-actions" style={{ marginTop: 18 }}>
                    <CertificatePreviewModal data={{ title: pick(c.titleAr, c.titleEn), holder: c.user?.name ?? "", related, serial: c.serial, issuedAt: longDate(c.issuedAt, lang, { arabicDigits: lang === "ar" }), kind: c.kind === "IJAZA" ? t.kindIjaza : t.kindCertificate, style: c.designStyle || "classic", pdfUrl: c.pdfUrl, labels: { preview: t.preview, close: t.close, download: t.download, print: t.print, holder: lang === "ar" ? "صاحب الوثيقة" : "Holder", related: lang === "ar" ? "الوثيقة مرتبطة بالمقرر" : "Related course", serial: t.serial, issuedAt: t.issuedAt } }} />
                    <Link className="btn btn-gold" href={href}>
                      {t.verify}
                    </Link>
                    {c.pdfUrl && (
                      <a
                        className="btn btn-outline-ink"
                        href={c.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t.download}
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
