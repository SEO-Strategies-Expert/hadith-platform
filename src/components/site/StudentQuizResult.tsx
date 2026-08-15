/**
 * نتيجة محاولةٍ في الاختبار — بعد التسليم فقط.
 *
 * هنا وحدَه يجوز كشف `Choice.correct` و`explainAr/En`، لأنّ المحاولة أُغلقت.
 * الصفحة ترفض عرض محاولةٍ لم تُسلَّم بعد وتعيد الطالب إلى شاشة الأداء، لئلّا
 * يصير هذا المسار بابًا خلفيًّا لرؤية الإجابات قبل التسليم.
 */
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/guard";
import type { Lang } from "@/lib/site-data";
import { isEnrolled, title } from "@/lib/lms";
import { gradeQuiz, isSubmitTooLate, type GradableQuestion, type QuizAnswers, type QuizQuestionKind } from "@/lib/quiz";
import { Pill, studentHref, num, NAVY } from "@/components/site/StudentPortalKit";

const T = {
  ar: {
    kicker: "نتيجة الاختبار",
    course: "المقرّر",
    backQuiz: "عودة إلى الاختبار",
    backCourse: "عودة إلى المقرّر",
    attempts: "كل محاولاتي",
    score: "الدرجة",
    passScore: "درجة النجاح",
    passed: "ناجح",
    failed: "لم تبلغ درجة النجاح",
    pendingAll: "لا تُحسب نسبةٌ لهذا الاختبار: كل أسئلته إجاباتٌ قصيرة يصحّحها المعلّم.",
    manualNotice:
      "فيه أسئلة إجابةٍ قصيرة لم تُصحَّح آليًّا. النسبة أعلاه محسوبةٌ من الأسئلة الآليّة وحدها، ولم تُحتسب إجاباتك القصيرة صفرًا — ينتظرها المعلّم.",
    lateNotice:
      "وصل تسليمك بعد انقضاء المهلة، فأُهملت الإجابات وأُغلقت المحاولة. راجع معلّمك إن كان لديك عذر.",
    correct: "إجابة صحيحة",
    wrong: "إجابة خاطئة",
    manual: "بانتظار تصحيح المعلّم",
    notAnswered: "لم تُجب عن هذا السؤال",
    yourAnswer: "إجابتك",
    correctAnswer: "الإجابة الصحيحة",
    explain: "الشرح",
    points: "الدرجة",
    submittedAt: "وقت التسليم",
    earned: "المكتسب",
  },
  en: {
    kicker: "Quiz result",
    course: "Course",
    backQuiz: "Back to the quiz",
    backCourse: "Back to course",
    attempts: "All my attempts",
    score: "Score",
    passScore: "Pass score",
    passed: "Passed",
    failed: "Below the pass score",
    pendingAll: "No percentage is calculated: every question here is a short answer graded by the instructor.",
    manualNotice:
      "Some short-answer questions are not auto-graded. The percentage above covers auto-graded questions only; your short answers were not scored as zero — the instructor will review them.",
    lateNotice:
      "Your submission arrived after the time limit, so the answers were discarded and the attempt was closed. Speak to your instructor if you have a reason.",
    correct: "Correct",
    wrong: "Incorrect",
    manual: "Awaiting instructor grading",
    notAnswered: "You did not answer this question",
    yourAnswer: "Your answer",
    correctAnswer: "Correct answer",
    explain: "Explanation",
    points: "Points",
    submittedAt: "Submitted at",
    earned: "Earned",
  },
} as const;

const cardStyle: React.CSSProperties = {
  border: "1px solid rgba(18,49,89,.12)",
  borderRadius: 16,
  background: "rgba(255,255,255,.75)",
  padding: "20px 22px",
};

export async function StudentQuizResult({
  lang,
  quizId,
  attemptId,
}: {
  lang: Lang;
  quizId: string;
  attemptId: string;
}) {
  const t = T[lang];
  const user = await currentUser();
  if (!user?.id) redirect(lang === "en" ? "/en/student-login.html" : "/student-login.html");

  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    select: {
      id: true,
      quizId: true,
      userId: true,
      startedAt: true,
      submittedAt: true,
      answers: true,
      score: true,
      passed: true,
      quiz: {
        select: {
          id: true,
          titleAr: true,
          titleEn: true,
          courseId: true,
          visible: true,
          passScore: true,
          timeLimitMin: true,
          course: { select: { titleAr: true, titleEn: true } },
        },
      },
    },
  });

  // ملكيّة المحاولة أوّلًا: محاولة طالبٍ آخر لا تُعرض ولا يُكشف وجودها.
  if (!attempt || attempt.userId !== user.id || attempt.quizId !== quizId) notFound();
  const quiz = attempt.quiz;
  if (!quiz.visible || !quiz.courseId) notFound();
  if (!(await isEnrolled(user.id, quiz.courseId))) notFound();

  // محاولةٌ لم تُسلَّم: لا نتيجة لها، ولا يجوز أن تكشف إجاباتٍ صحيحة.
  if (!attempt.submittedAt) redirect(studentHref(lang, `/quiz/${quizId}`));

  const questions = await prisma.question.findMany({
    where: { quizId },
    orderBy: [{ order: "asc" }, { id: "asc" }],
    select: {
      id: true,
      kind: true,
      textAr: true,
      textEn: true,
      points: true,
      explainAr: true,
      explainEn: true,
      choices: {
        orderBy: [{ order: "asc" }, { id: "asc" }],
        select: { id: true, textAr: true, textEn: true, correct: true },
      },
    },
  });

  const answers = (attempt.answers ?? {}) as QuizAnswers;
  const gradable: GradableQuestion[] = questions.map((q) => ({
    id: q.id,
    kind: q.kind as QuizQuestionKind,
    points: q.points,
    correctChoiceIds: q.choices.filter((c) => c.correct).map((c) => c.id),
  }));

  // نعيد التصحيح للعرض التفصيليّ فقط؛ **الدرجة المعتمدة هي المخزَّنة** وقت
  // التسليم، فلا يتغيّر ما نال الطالب لو عُدّلت الأسئلة بعد ذلك.
  const detail = gradeQuiz(gradable, answers, quiz.passScore);
  const byId = new Map(detail.outcomes.map((o) => [o.questionId, o]));

  const wasLate = isSubmitTooLate(attempt.startedAt, quiz.timeLimitMin, attempt.submittedAt);

  return (
    <main id="main">
      <section className="page-hero orn-navy">
        <div className="container">
          <div className="page-hero-copy reveal">
            <p className="page-kicker">{t.kicker}</p>
            <h1 className="page-title thuluth gold-text">{title(lang, quiz.titleAr, quiz.titleEn)}</h1>
            <div className="page-meta">
              <span>
                {t.course}: {title(lang, quiz.course?.titleAr ?? null, quiz.course?.titleEn ?? null)}
              </span>
              <span>
                {t.passScore}: {num(quiz.passScore, lang)}
                {lang === "ar" ? "٪" : "%"}
              </span>
              <span>
                {t.submittedAt}:{" "}
                {new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "ar-QA", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(attempt.submittedAt)}
              </span>
            </div>
            <div className="page-actions" style={{ marginTop: 22 }}>
              <Link className="btn btn-outline-ink" href={studentHref(lang, `/quiz/${quizId}`)}>
                {t.backQuiz}
              </Link>
              <Link className="btn btn-outline-ink" href={studentHref(lang, `/quiz/${quizId}/attempts`)}>
                {t.attempts}
              </Link>
              <Link className="btn btn-outline-ink" href={studentHref(lang, `/course/${quiz.courseId}`)}>
                {t.backCourse}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="inner-section white orn-cream">
        <div className="container">
          <div style={cardStyle} className="reveal">
            {attempt.score === null ? (
              <p style={{ fontWeight: 800, color: NAVY, lineHeight: 1.9 }}>{t.pendingAll}</p>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
                <span style={{ fontSize: 40, fontWeight: 900, color: NAVY, lineHeight: 1 }}>
                  {num(attempt.score, lang)}
                  {lang === "ar" ? "٪" : "%"}
                </span>
                <Pill tone={attempt.passed ? "gold" : "muted"}>
                  {attempt.passed ? t.passed : t.failed}
                </Pill>
                <Pill tone="muted">
                  {t.earned}: {num(detail.earnedPoints, lang)} / {num(detail.autoPoints, lang)}
                </Pill>
              </div>
            )}

            {wasLate && (
              <p style={{ marginTop: 14, fontWeight: 800, color: "#8a2b2b", lineHeight: 1.9 }}>
                {t.lateNotice}
              </p>
            )}

            {detail.needsManualReview && attempt.score !== null && (
              <p style={{ marginTop: 14, lineHeight: 1.9, color: "#5c6b80", fontWeight: 700 }}>
                {t.manualNotice}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="inner-section cream orn-cream">
        <div className="container">
          <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 18 }}>
            {questions.map((q, i) => {
              const o = byId.get(q.id);
              const correctChoices = q.choices.filter((c) => c.correct);
              const explanation = title(lang, q.explainAr, q.explainEn);

              return (
                <li key={q.id} style={cardStyle}>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 10,
                      alignItems: "center",
                      marginBottom: 12,
                    }}
                  >
                    <Pill tone="navy">{num(i + 1, lang)}</Pill>
                    <Pill tone="muted">
                      {num(q.points, lang)} {t.points}
                    </Pill>
                    {o?.manual ? (
                      <Pill tone="muted">{t.manual}</Pill>
                    ) : o?.correct ? (
                      <Pill tone="gold">{t.correct} ✓</Pill>
                    ) : (
                      <Pill tone="muted">{t.wrong}</Pill>
                    )}
                  </div>

                  <p style={{ fontSize: 16, fontWeight: 800, color: NAVY, lineHeight: 1.9 }}>
                    {title(lang, q.textAr, q.textEn)}
                  </p>

                  {q.kind === "SHORT" ? (
                    <div style={{ marginTop: 12 }}>
                      <b style={{ fontSize: 13, color: NAVY }}>{t.yourAnswer}:</b>
                      {/* نصّ الطالب يُعرض نصًّا صِرفًا لا HTML. */}
                      <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.95, marginTop: 6 }}>
                        {o?.textAnswer ?? <em style={{ color: "#8a2b2b" }}>{t.notAnswered}</em>}
                      </p>
                    </div>
                  ) : (
                    <ul style={{ listStyle: "none", margin: "12px 0 0", padding: 0, display: "grid", gap: 8 }}>
                      {q.choices.map((c) => {
                        const chosen = o?.selectedChoiceIds.includes(c.id) ?? false;
                        const good = c.correct;
                        return (
                          <li
                            key={c.id}
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 10,
                              padding: "10px 14px",
                              borderRadius: 12,
                              lineHeight: 1.8,
                              border: `1px solid ${good ? "rgba(30,140,80,.45)" : chosen ? "rgba(190,30,30,.35)" : "rgba(18,49,89,.12)"}`,
                              background: good
                                ? "rgba(30,140,80,.09)"
                                : chosen
                                  ? "rgba(190,30,30,.07)"
                                  : "#fff",
                            }}
                          >
                            <span aria-hidden="true" style={{ fontWeight: 900 }}>
                              {good ? "✓" : chosen ? "✕" : "•"}
                            </span>
                            <span style={{ flex: 1, fontWeight: 700, color: "#1c2a3d" }}>
                              {title(lang, c.textAr, c.textEn)}
                            </span>
                            {chosen && <Pill tone="muted">{t.yourAnswer}</Pill>}
                            {good && <Pill tone="gold">{t.correctAnswer}</Pill>}
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {!o?.answered && q.kind !== "SHORT" && (
                    <p style={{ marginTop: 10, color: "#8a2b2b", fontWeight: 700 }}>{t.notAnswered}</p>
                  )}

                  {q.kind !== "SHORT" && correctChoices.length === 0 && (
                    <p style={{ marginTop: 10, color: "#8a2b2b", fontWeight: 700 }}>
                      {lang === "ar"
                        ? "لم تُحدَّد إجابةٌ صحيحة لهذا السؤال في اللوحة — راجع معلّمك."
                        : "No correct answer is defined for this question — contact your instructor."}
                    </p>
                  )}

                  {explanation && (
                    <div
                      style={{
                        marginTop: 14,
                        padding: "12px 16px",
                        borderRadius: 12,
                        background: "rgba(217,174,75,.10)",
                        border: "1px solid rgba(217,174,75,.35)",
                      }}
                    >
                      <b style={{ fontSize: 13, color: "#8a6a1c" }}>{t.explain}:</b>
                      <p style={{ marginTop: 5, lineHeight: 1.95, color: "#1c2a3d" }}>{explanation}</p>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </section>
    </main>
  );
}
