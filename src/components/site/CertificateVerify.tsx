/**
 * صفحة التحقّق العلنيّة من الشهادات والإجازات المسنَدة.
 *
 * ثلاثة قيودٍ صاغت هذا المكوّن:
 *
 * ١) **يعمل بلا JavaScript** — نموذج `GET` عاديّ يعيد تحميل الصفحة بـ`?code=`،
 *    كما تعمل بقيّة نماذج الموقع. ويقبل الرمز من الرابط المشارَك مباشرةً.
 *
 * ٢) **لا يكشف شيئًا عن الطالب سوى اسمه** — البيانات تأتي من
 *    `verifyCertificate` وقد انتُقيت في الاستعلام صراحةً؛ لا بريد ولا هاتف
 *    ولا رقم جامعيّ ولا معرّف داخليّ.
 *
 * ٣) **لا يعين مخمِّنًا** — الرمز الخاطئ الصيغة والرمز غير الموجود يُجابان
 *    بالرسالة نفسها؛ ولا شيء في الصفحة يخبر المجرِّب أنّه اقترب.
 */
import Link from "next/link";
import type { Lang } from "@/lib/site-data";
import { longDate } from "@/lib/site-format";
import { siteHref } from "@/lib/site-links";
import { verifyCertificate, formatVerifyCode, VERIFY_CODE_LENGTH } from "@/lib/certificates";

const T = {
  ar: {
    home: "الرئيسية",
    crumb: "التحقّق من الوثائق",
    kicker: "خدمةٌ علنيّةٌ لا تحتاج تسجيل دخول",
    title: "التحقّقُ من الشهادات والإجازات",
    intro:
      "كلُّ شهادةٍ أو إجازةٍ مسنَدةٍ تصدرها الكلّية تحمل رقمَ توثيقٍ ورمزَ تحقُّقٍ قابلًا للمشاركة. أدخِل الرمز أدناه ليظهر لك بيانُ الوثيقة كما هو مثبتٌ في سجلّ الكلّية.",
    metaOne: "بلا تسجيل دخول",
    metaTwo: "يعمل من الرابط المشارَك",
    formTitle: "أدخِل رمز التحقّق",
    formLede:
      "الرمز مكتوبٌ على الوثيقة، ومكوَّنٌ من اثني عشر محرفًا. لا حاجة إلى مراعاة الشرطات ولا حالة الأحرف.",
    label: "رمز التحقّق",
    submit: "تحقَّق",
    validTitle: "وثيقةٌ صحيحة، ثابتةٌ في سجلّ الكلّية",
    validLede:
      "هذه الوثيقة صادرةٌ عن الكلّية العليا للحديث النبوي وعلومه وعِلَلِه، وبياناتُها كما يلي.",
    revokedTitle: "هذه الوثيقةُ ملغاة",
    revokedLede:
      "أُلغِيت هذه الوثيقة ولم تعد معتمدةً لدى الكلّية. فمن احتجَّ بها بعد إلغائها فلا عبرة بها.",
    unknownTitle: "لم نجد وثيقةً بهذا الرمز",
    unknownLede:
      "راجِع كتابة الرمز كما ورد في الوثيقة نفسها. فإن صحّ عندك ولم يظهر شيء فراسِل الكلّية.",
    contact: "تواصل مع الكلّية",
    kindCertificate: "شهادة إتمام",
    kindIjaza: "إجازة مسنَدة",
    holder: "صاحب الوثيقة",
    docTitle: "عنوان الوثيقة",
    course: "المقرّر",
    stage: "المرحلة",
    serial: "رقم التوثيق",
    code: "رمز التحقّق",
    issuedAt: "تاريخ الإصدار",
    grantedBy: "المُجيز",
    isnad: "نصُّ السند",
    statusValid: "سارية",
    statusRevoked: "ملغاة",
  },
  en: {
    home: "Home",
    crumb: "Verify a document",
    kicker: "A public service — no sign-in required",
    title: "Verify Certificates and Licences",
    intro:
      "Every certificate and every chained licence (ijāza) issued by the College carries a documentation number and a shareable verification code. Enter the code below to see the record exactly as it is held in the College register.",
    metaOne: "No sign-in",
    metaTwo: "Works from a shared link",
    formTitle: "Enter the verification code",
    formLede:
      "The code is printed on the document and consists of twelve characters. Dashes and letter case do not matter.",
    label: "Verification code",
    submit: "Verify",
    validTitle: "A valid document, held in the College register",
    validLede:
      "This document was issued by The Higher College of Prophetic Hadith, Sciences, and Studies. Its particulars are as follows.",
    revokedTitle: "This document has been revoked",
    revokedLede:
      "This document has been revoked and is no longer recognised by the College. Any claim made on its basis after revocation carries no weight.",
    unknownTitle: "No document matches this code",
    unknownLede:
      "Please check the code against the document itself. If it is correct and still returns nothing, write to the College.",
    contact: "Contact the College",
    kindCertificate: "Certificate of completion",
    kindIjaza: "Chained licence (ijāza)",
    holder: "Holder",
    docTitle: "Document title",
    course: "Course",
    stage: "Stage",
    serial: "Documentation number",
    code: "Verification code",
    issuedAt: "Date of issue",
    grantedBy: "Granted by",
    isnad: "The chain of transmission",
    statusValid: "Valid",
    statusRevoked: "Revoked",
  },
} as const;

/** صفٌّ من بيان الوثيقة — لا صنف CSS له، فيُبنى بتنسيق مضمَّن كبقيّة البوابة. */
function Row({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 14,
        flexWrap: "wrap",
        padding: "12px 0",
        borderBottom: "1px solid rgba(18,49,89,.10)",
      }}
    >
      <span style={{ fontWeight: 800, color: "#123159", minWidth: 170 }}>{label}</span>
      <span style={{ color: "#3d4a5c", fontWeight: 700 }} dir={ltr ? "ltr" : "auto"}>
        {value}
      </span>
    </div>
  );
}

export async function CertificateVerify({ lang, code }: { lang: Lang; code?: string }) {
  const t = T[lang];
  const submitted = (code ?? "").trim();
  // لا استعلامَ أصلًا ما لم يُرسَل رمز — الزيارة الأولى لا تمسّ القاعدة.
  const result = submitted ? await verifyCertificate(submitted) : null;
  const cert = result && result.status !== "unknown" ? result.certificate : null;

  const pick = (ar: string | null, en: string | null) =>
    (lang === "ar" ? ar : en) ?? (lang === "ar" ? en : ar) ?? "";

  const relatedTo = cert
    ? cert.courseAr || cert.courseEn
      ? { label: t.course, value: pick(cert.courseAr, cert.courseEn) }
      : cert.stageAr || cert.stageEn
        ? { label: t.stage, value: pick(cert.stageAr, cert.stageEn) }
        : null
    : null;

  return (
    <main id="main">
      <section className="page-hero orn-navy">
        <div className="container">
          <nav className="breadcrumbs" aria-label={lang === "ar" ? "مسار التنقل" : "Breadcrumb"}>
            <Link href={siteHref(lang, "index.html")}>{t.home}</Link>
            <span className="sep">/</span>
            <strong>{t.crumb}</strong>
          </nav>
          <div className="page-hero-copy reveal">
            <p className="page-kicker">{t.kicker}</p>
            <h1 className={lang === "ar" ? "page-title thuluth gold-text" : "page-title gold-text"}>
              {t.title}
            </h1>
            <p className="page-intro">{t.intro}</p>
            <div className="page-meta">
              <span>{t.metaOne}</span>
              <span>{t.metaTwo}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="inner-section white orn-cream" id="verify">
        <div className="container">
          <div className="form-panel reveal" style={{ maxWidth: 780, margin: "0 auto" }}>
            <header className="section-cap" style={{ marginBottom: 18 }}>
              <h2 className={lang === "ar" ? "thuluth" : undefined}>{t.formTitle}</h2>
              <p>{t.formLede}</p>
            </header>

            {/* نموذج GET صرف: يعمل بلا JavaScript، ويجعل الرابط قابلًا للمشاركة. */}
            <form method="get" action={siteHref(lang, "verify.html")} className="form-grid">
              <div className="field full">
                <label htmlFor="code">{t.label}</label>
                <input
                  id="code"
                  name="code"
                  type="text"
                  required
                  dir="ltr"
                  autoComplete="off"
                  spellCheck={false}
                  maxLength={VERIFY_CODE_LENGTH * 2}
                  defaultValue={submitted}
                  placeholder="XXXX-XXXX-XXXX"
                  style={{ letterSpacing: "0.14em", fontWeight: 800, textAlign: "center" }}
                />
              </div>
              <div className="field full">
                <button className="btn btn-gold" type="submit">
                  {t.submit}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {result && (
        <section className="inner-section cream orn-cream" id="result">
          <div className="container">
            {result.status === "unknown" || !cert ? (
              // رسالةٌ واحدة للرمز المجهول وللرمز المشوَّه الصيغة — بلا تفصيلٍ يعين مخمِّنًا.
              <div className="callout reveal" style={{ maxWidth: 780, margin: "0 auto" }}>
                <h3>{t.unknownTitle}</h3>
                <p>{t.unknownLede}</p>
                <div className="page-actions" style={{ marginTop: 20 }}>
                  <Link className="btn btn-outline-ink" href={siteHref(lang, "contact.html")}>
                    {t.contact}
                  </Link>
                </div>
              </div>
            ) : (
              <div
                className={`form-panel reveal certificate-public-card certificate-style-${cert.designStyle || "classic"}`}
                style={{
                  maxWidth: 900,
                  margin: "0 auto",
                  borderColor:
                    result.status === "revoked" ? "rgba(160,32,32,.35)" : "rgba(217,174,75,.45)",
                  borderWidth: 2,
                }}
              >
                <span className="certificate-decor certificate-decor-one" /><span className="certificate-decor certificate-decor-two" /><span className="certificate-wave certificate-wave-one" /><span className="certificate-wave certificate-wave-two" />
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 10,
                    alignItems: "center",
                    marginBottom: 14,
                  }}
                >
                  <span
                    style={{
                      padding: "6px 16px",
                      borderRadius: 999,
                      fontWeight: 800,
                      fontSize: 13,
                      background: "rgba(18,49,89,.10)",
                      border: "1px solid rgba(18,49,89,.25)",
                      color: "#123159",
                    }}
                  >
                    {cert.kind === "IJAZA" ? t.kindIjaza : t.kindCertificate}
                  </span>
                  <span
                    style={{
                      padding: "6px 16px",
                      borderRadius: 999,
                      fontWeight: 800,
                      fontSize: 13,
                      background:
                        result.status === "revoked" ? "rgba(160,32,32,.10)" : "rgba(20,120,80,.10)",
                      border:
                        result.status === "revoked"
                          ? "1px solid rgba(160,32,32,.35)"
                          : "1px solid rgba(20,120,80,.35)",
                      color: result.status === "revoked" ? "#9b1c1c" : "#12684d",
                    }}
                  >
                    {result.status === "revoked" ? t.statusRevoked : t.statusValid}
                  </span>
                </div>

                <header className="section-cap" style={{ marginBottom: 10 }}>
                  <h2 className={lang === "ar" ? "thuluth" : undefined}>
                    {result.status === "revoked" ? t.revokedTitle : t.validTitle}
                  </h2>
                  <p>{result.status === "revoked" ? t.revokedLede : t.validLede}</p>
                </header>

                <div style={{ display: "grid", gap: 2, marginTop: 18 }}>
                  <Row label={t.holder} value={cert.holderName} />
                  <Row label={t.docTitle} value={pick(cert.titleAr, cert.titleEn)} />
                  {relatedTo && <Row label={relatedTo.label} value={relatedTo.value} />}
                  <Row label={t.serial} value={cert.serial} ltr />
                  <Row label={t.code} value={formatVerifyCode(cert.verifyCode)} ltr />
                  <Row
                    label={t.issuedAt}
                    value={longDate(cert.issuedAt, lang, { arabicDigits: lang === "ar" })}
                  />
                  {/* السند والمُجيز لا يُعرضان لوثيقةٍ ملغاة: عرضهما إظهارٌ لها في صورة الصحيحة. */}
                  {result.status === "valid" && cert.kind === "IJAZA" && (cert.grantedByAr || cert.grantedByEn) && (
                    <Row label={t.grantedBy} value={pick(cert.grantedByAr, cert.grantedByEn)} />
                  )}
                </div>

                {result.status === "valid" &&
                  cert.kind === "IJAZA" &&
                  (cert.isnadAr || cert.isnadEn) && (
                    <div style={{ marginTop: 26 }}>
                      <h3 style={{ color: "#123159", margin: "0 0 12px" }}>{t.isnad}</h3>
                      {/* `lab-document` صنفٌ قائمٌ في الموقع لعرض المتون بخطّ النسخ. */}
                      <div className="lab-document" style={{ whiteSpace: "pre-line", minHeight: 0 }}>
                        {pick(cert.isnadAr, cert.isnadEn)}
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
