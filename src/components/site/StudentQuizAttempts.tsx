/**
 * سجلّ محاولات الطالب في اختبارٍ بعينه.
 *
 * لا يعرض إجاباتٍ ولا حلولًا — أرقامًا وروابط فقط؛ فالتفصيل في صفحة النتيجة
 * التي ترفض أصلًا فتح محاولةٍ لم تُسلَّم.
 */
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/guard";
import type { Lang } from "@/lib/site-data";
import { isEnrolled, title } from "@/lib/lms";
import { Pill, studentHref, num, NAVY } from "@/components/site/StudentPortalKit";

const T = {
  ar: {
    kicker: "محاولاتي",
    backQuiz: "عودة إلى الاختبار",
    empty: "لم تبدأ أي محاولة في هذا الاختبار بعد.",
    attempt: "المحاولة",
    started: "بدأت",
    submitted: "سُلّمت",
    inProgress: "جارية — لم تُسلَّم بعد",
    score: "الدرجة",
    passed: "ناجح",
    failed: "راسب",
    pending: "بانتظار تصحيح المعلّم",
    view: "عرض التفاصيل",
    resume: "أكمل المحاولة",
    passScore: "درجة النجاح",
  },
  en: {
    kicker: "My attempts",
    backQuiz: "Back to the quiz",
    empty: "You have not started any attempt at this quiz yet.",
    attempt: "Attempt",
    started: "Started",
    submitted: "Submitted",
    inProgress: "In progress — not submitted",
    score: "Score",
    passed: "Passed",
    failed: "Not passed",
    pending: "Awaiting instructor grading",
    view: "View details",
    resume: "Resume the attempt",
    passScore: "Pass score",
  },
} as const;

export async function StudentQuizAttempts({ lang, quizId }: { lang: Lang; quizId: string }) {
  const t = T[lang];
  const user = await currentUser();
  if (!user?.id) redirect(lang === "en" ? "/en/student-login.html" : "/student-login.html");

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: { id: true, titleAr: true, titleEn: true, courseId: true, visible: true, passScore: true },
  });
  if (!quiz || !quiz.visible || !quiz.courseId) notFound();
  if (!(await isEnrolled(user.id, quiz.courseId))) notFound();

  const attempts = await prisma.quizAttempt.findMany({
    where: { quizId, userId: user.id },
    orderBy: { startedAt: "desc" },
    select: { id: true, startedAt: true, submittedAt: true, score: true, passed: true },
  });

  const fmt = (d: Date) =>
    new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "ar-QA", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);

  return (
    <main id="main">
      <section className="page-hero orn-navy">
        <div className="container">
          <div className="page-hero-copy reveal">
            <p className="page-kicker">{t.kicker}</p>
            <h1 className="page-title thuluth gold-text">{title(lang, quiz.titleAr, quiz.titleEn)}</h1>
            <div className="page-meta">
              <span>
                {t.passScore}: {num(quiz.passScore, lang)}
                {lang === "ar" ? "٪" : "%"}
              </span>
            </div>
            <div className="page-actions" style={{ marginTop: 22 }}>
              <Link className="btn btn-outline-ink" href={studentHref(lang, `/quiz/${quizId}`)}>
                {t.backQuiz}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="inner-section white orn-cream">
        <div className="container">
          {attempts.length === 0 ? (
            <div className="callout reveal">
              <p>{t.empty}</p>
            </div>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 14 }}>
              {attempts.map((a, i) => (
                <li
                  key={a.id}
                  style={{
                    border: "1px solid rgba(18,49,89,.12)",
                    borderRadius: 16,
                    background: "rgba(255,255,255,.75)",
                    padding: "18px 20px",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 14,
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <b style={{ color: NAVY, fontSize: 15 }}>
                      {t.attempt} {num(attempts.length - i, lang)}
                    </b>
                    <div style={{ fontSize: 12.5, color: "#5c6b80", marginTop: 4 }}>
                      {t.started}: {fmt(a.startedAt)}
                      {a.submittedAt ? ` — ${t.submitted}: ${fmt(a.submittedAt)}` : ""}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                    {!a.submittedAt ? (
                      <>
                        <Pill tone="navy">{t.inProgress}</Pill>
                        <Link
                          className="btn btn-gold"
                          style={{ padding: "6px 16px", fontSize: 13 }}
                          href={studentHref(lang, `/quiz/${quizId}`)}
                        >
                          {t.resume}
                        </Link>
                      </>
                    ) : (
                      <>
                        {a.score === null ? (
                          <Pill tone="muted">{t.pending}</Pill>
                        ) : (
                          <>
                            <Pill tone="navy">
                              {t.score}: {num(a.score, lang)}
                              {lang === "ar" ? "٪" : "%"}
                            </Pill>
                            <Pill tone={a.passed ? "gold" : "muted"}>
                              {a.passed ? t.passed : t.failed}
                            </Pill>
                          </>
                        )}
                        <Link
                          className="btn btn-outline-ink"
                          style={{ padding: "6px 16px", fontSize: 13 }}
                          href={studentHref(lang, `/quiz/${quizId}/attempt/${a.id}`)}
                        >
                          {t.view}
                        </Link>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
