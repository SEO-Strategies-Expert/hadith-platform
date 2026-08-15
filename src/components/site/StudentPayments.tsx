/**
 * «رسومي ومدفوعاتي» في بوابة الطالب.
 *
 * أمنيًّا: **لا يقبل هذا المكوّن معرّف مستخدم من أحد.** المعرّف يُشتقّ من
 * الجلسة داخله ويُمرَّر شرطًا في الاستعلام نفسه (`where: { userId }`)، فلا
 * سبيل لعرض ماليّة طالبٍ آخر بتغيير رابطٍ أو خاصيّةٍ في الاستدعاء. لهذا
 * يخالف `StudentCourses` الذي يستقبل `userId` — البيانات الماليّة أحسّ.
 *
 * ونبرةً: رسوم الكلّية اختياريّة وليست شرطًا للقبول، فليس في نصوص هذه
 * الشاشة مطالبةٌ ولا استحقاقٌ ولا تلميحٌ إلى نقصٍ في حقّ من أُعفي أو درس
 * مجّانًا. الغرض بيانٌ وتوثيق لا محاسبة.
 */
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/guard";
import type { Lang } from "@/lib/site-data";
import { longDate } from "@/lib/site-format";
import { title } from "@/lib/lms";
import { Pill } from "@/components/site/StudentPortalKit";
import {
  formatAmount,
  formatMinor,
  statusLabel,
  methodLabel,
  feeOptionLabel,
  studentFinancials,
} from "@/lib/payments";

const T = {
  ar: {
    heading: "رسومي ومدفوعاتي",
    lede: "رسوم الكلّية اختياريّة وليست شرطًا للقبول؛ ولكلّ طالبٍ ما يناسب قدرته. هذا بيانٌ لما هو مسجَّل باسمك.",
    feeSystem: "نظام الرسوم في مقرّراتي",
    records: "سجلّ الدفعات",
    noRecords: "لا توجد دفعات مسجَّلة باسمك.",
    noRecordsFree: "دراستك مجّانيّة، فلا سجلّ مدفوعات لك — وهذا اختيارٌ معتمَد من الكلّية.",
    freeNote: "دراستك في هذا المقرّر مجّانيّة.",
    reducedNote: "رسومك في هذا المقرّر مخفَّضة.",
    fullNote: "رسومك في هذا المقرّر كاملة.",
    paidTotal: "المسدَّد",
    pendingTotal: "قيد التأكيد",
    waivedTotal: "إعفاء",
    pendingNote:
      "دفعاتٌ وصلت الكلّية وهي قيد التأكيد الإداريّ. لا يلزمك فعلُ شيء؛ ستُحدَّث حالتها هنا.",
    waivedNote: "الإعفاء مُثبَت للتوثيق وحده، ولا شيء مستحقٌّ عليك فيه.",
    general: "دفعة عامّة",
    method: "الطريقة",
    date: "التاريخ",
    note: "ملاحظة",
    contact: "لأي استفسارٍ عن الرسوم تواصل مع إدارة الكلّية.",
  },
  en: {
    heading: "My fees and payments",
    lede: "Fees at the college are optional and are not a condition of admission; each student is offered what suits their means. This is a statement of what is recorded in your name.",
    feeSystem: "Fee arrangement for my courses",
    records: "Payment record",
    noRecords: "No payments are recorded in your name.",
    noRecordsFree:
      "Your study is free of charge, so there is no payment record — an arrangement approved by the college.",
    freeNote: "Your study on this course is free of charge.",
    reducedNote: "Your fees on this course are reduced.",
    fullNote: "Your fees on this course are the full amount.",
    paidTotal: "Received",
    pendingTotal: "Being confirmed",
    waivedTotal: "Waived",
    pendingNote:
      "Payments that have reached the college and are awaiting administrative confirmation. Nothing is required from you; their status will be updated here.",
    waivedNote: "The waiver is recorded for documentation only; nothing is owed on it.",
    general: "General payment",
    method: "Method",
    date: "Date",
    note: "Note",
    contact: "For any question about fees, please contact the college administration.",
  },
} as const;

const FEE_NOTE = {
  free: "freeNote",
  reduced: "reducedNote",
  full: "fullNote",
} as const;

export async function StudentPayments({ lang }: { lang: Lang }) {
  const user = await currentUser();
  // بلا جلسةٍ لا يُصيَّر شيء — الصفحة الحاضنة هي التي تتولّى إعادة التوجيه.
  if (!user?.id) return null;

  const t = T[lang];
  const userId = user.id;

  const [enrollments, payments] = await Promise.all([
    prisma.enrollment.findMany({
      where: { userId },
      orderBy: { enrolledAt: "desc" },
      select: {
        id: true,
        feeOption: true,
        course: { select: { titleAr: true, titleEn: true } },
      },
    }),
    prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        amount: true,
        currency: true,
        status: true,
        method: true,
        paidAt: true,
        createdAt: true,
        note: true,
        enrollmentId: true,
        enrollment: { select: { course: { select: { titleAr: true, titleEn: true } } } },
      },
    }),
  ]);

  // لا تسجيلَ ولا دفعة: لا شيء يُقال، فلا يُعرض قسمٌ فارغ.
  if (enrollments.length === 0 && payments.length === 0) return null;

  const fin = studentFinancials(enrollments, payments);

  return (
    <section className="inner-section white orn-cream" id="my-payments">
      <div className="container">
        <header className="section-cap reveal">
          <h2 className="thuluth">{t.heading}</h2>
          <p>{t.lede}</p>
        </header>

        {enrollments.length > 0 && (
          <div className="reveal" style={{ marginBottom: 28 }}>
            <h3 style={{ marginBottom: 12 }}>{t.feeSystem}</h3>
            <div style={{ display: "grid", gap: 2 }}>
              {enrollments.map((e) => {
                const fee = fin.feeByEnrollment.get(e.id) ?? "free";
                return (
                  <div
                    key={e.id}
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 0",
                      borderBottom: "1px solid rgba(18,49,89,.10)",
                    }}
                  >
                    <span style={{ fontWeight: 800, color: "#123159", minWidth: 220 }}>
                      {title(lang, e.course.titleAr, e.course.titleEn)}
                    </span>
                    <Pill tone={fee === "full" ? "navy" : "gold"}>{feeOptionLabel(fee, lang)}</Pill>
                    <span style={{ color: "#3d4a5c", fontSize: 13.5 }}>{t[FEE_NOTE[fee]]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* المجاميع مفصولةٌ بالعملة، والإعفاء لا يُجمع مع المسدَّد. */}
        {fin.byCurrency.map((totals) => (
          <div
            key={totals.currency}
            className="reveal"
            style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 18 }}
          >
            {totals.collected !== 0 && (
              <Pill>
                {t.paidTotal}: {formatMinor(totals.collected, totals.currency, lang)}
              </Pill>
            )}
            {totals.pending !== 0 && (
              <Pill tone="navy">
                {t.pendingTotal}: {formatMinor(totals.pending, totals.currency, lang)}
              </Pill>
            )}
            {totals.waived !== 0 && (
              <Pill tone="muted">
                {t.waivedTotal}: {formatMinor(totals.waived, totals.currency, lang)}
              </Pill>
            )}
          </div>
        ))}

        <h3 style={{ marginBottom: 12 }}>{t.records}</h3>

        {payments.length === 0 ? (
          <p>{fin.allFree ? t.noRecordsFree : t.noRecords}</p>
        ) : (
          <div className="card-grid">
            {payments.map((p) => {
              const course = p.enrollment?.course;
              return (
                <article className="info-card reveal" key={p.id}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                    <Pill
                      tone={p.status === "PAID" ? "gold" : p.status === "WAIVED" ? "muted" : "navy"}
                    >
                      {statusLabel(p.status, lang)}
                    </Pill>
                    {p.method && <Pill tone="muted">{methodLabel(p.method, lang)}</Pill>}
                  </div>

                  <h3 style={{ direction: lang === "ar" ? "rtl" : "ltr" }}>
                    {formatAmount(p.amount, p.currency, lang)}
                  </h3>

                  <p style={{ margin: "0 0 4px", fontWeight: 700 }}>
                    {course ? title(lang, course.titleAr, course.titleEn) : t.general}
                  </p>

                  <p style={{ margin: "0 0 4px" }}>
                    {t.date}:{" "}
                    {longDate(p.paidAt ?? p.createdAt, lang, { arabicDigits: lang === "ar" })}
                  </p>

                  {p.note && (
                    <p style={{ margin: 0 }}>
                      {t.note}: {p.note}
                    </p>
                  )}

                  {p.status === "WAIVED" && (
                    <p style={{ margin: "8px 0 0", fontSize: 13 }}>{t.waivedNote}</p>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {fin.hasPending && (
          <div className="callout reveal" style={{ marginTop: 24 }}>
            <p style={{ margin: 0 }}>{t.pendingNote}</p>
          </div>
        )}

        <p style={{ marginTop: 20, fontSize: 13.5, color: "#3d4a5c" }}>{t.contact}</p>
      </div>
    </section>
  );
}
