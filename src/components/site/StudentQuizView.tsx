/**
 * أداء الاختبار في بوابة الطالب.
 *
 * ثلاثة ضمانات تحكم هذا الملفّ:
 *  ١) **الوصول**: الاختبار لا يُفتح إلّا لطالبٍ مسجَّل الدخول ومسجَّل في مقرّر
 *     الاختبار. `src/proxy.ts` لا يغطّي المسارات الفرعيّة، فالفحص هنا هو الحارس.
 *  ٢) **سرّيّة الإجابات**: الاستعلام ينتقي الحقول صراحةً ولا يقرأ `Choice.correct`
 *     ولا `explainAr/En` قبل التسليم — فلا تصل الإجابة الصحيحة إلى المتصفّح ولا
 *     في حمولة RSC.
 *  ٣) **الوقت**: يُحسب من `startedAt` على الخادم؛ مؤقّت المتصفّح عرضٌ لا حكم.
 */
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/guard";
import type { Lang } from "@/lib/site-data";
import { isEnrolled, title } from "@/lib/lms";
import { attemptDeadline, isAttemptExpired, answerFieldName, shuffleWithSeed } from "@/lib/quiz";
import { startQuizAttempt, submitQuizAttempt } from "@/app/(site)/student-quiz-actions";
import { Pill, studentHref, num, NAVY } from "@/components/site/StudentPortalKit";
import { StudentQuizTimer } from "@/components/site/StudentQuizTimer";

const T = {
  ar: {
    kicker: "اختبار",
    course: "المقرّر",
    backCourse: "عودة إلى المقرّر",
    attempts: "محاولاتي السابقة",
    passScore: "درجة النجاح",
    timeLimit: "زمن الاختبار",
    minutes: "دقيقة",
    noLimit: "بلا توقيت",
    unlimited: "بلا حدّ",
    attemptsAllowed: "المحاولات المسموحة",
    attemptsLeft: "المتبقّي لك",
    questions: "عدد الأسئلة",
    points: "الدرجة",
    start: "ابدأ الاختبار",
    startNote:
      "يبدأ حساب الوقت من لحظة الضغط، ويُحسب على الخادم لا على جهازك؛ فلا يوقفه إغلاق الصفحة.",
    empty: "لم تُضَف أسئلة لهذا الاختبار بعد، فلا يمكن أداؤه الآن.",
    exhausted: "استنفدت عدد المحاولات المسموحة في هذا الاختبار.",
    inProgress: "محاولة جارية",
    submit: "سلّم الاختبار",
    submitNote: "راجع إجاباتك قبل التسليم — لا يمكن التراجع بعده.",
    expired: "انتهى وقت هذه المحاولة",
    expiredNote:
      "انقضت المهلة قبل أن تسلّم. أغلق المحاولة لتُسجَّل نتيجتها، وستُهمَل أي إجابات تُرسَل الآن.",
    closeAttempt: "أغلق المحاولة المنتهية",
    shortHint: "سؤال إجابةٍ قصيرة: يصحّحه المعلّم بنفسه ولا يُحتسب صفرًا آليًّا.",
    multiHint: "اختر كل الإجابات الصحيحة — الاحتساب بالتطابق التامّ.",
    singleHint: "اختر إجابةً واحدة.",
    yourAnswer: "إجابتك",
    lastResult: "آخر نتيجة",
    passed: "ناجح",
    failed: "راسب",
    pending: "بانتظار تصحيح المعلّم",
    viewResult: "عرض النتيجة",
  },
  en: {
    kicker: "Quiz",
    course: "Course",
    backCourse: "Back to course",
    attempts: "My previous attempts",
    passScore: "Pass score",
    timeLimit: "Time limit",
    minutes: "min",
    noLimit: "No time limit",
    unlimited: "Unlimited",
    attemptsAllowed: "Attempts allowed",
    attemptsLeft: "Attempts left",
    questions: "Questions",
    points: "Points",
    start: "Start the quiz",
    startNote:
      "The clock starts when you press, and is measured on the server — closing the page will not pause it.",
    empty: "No questions have been added to this quiz yet, so it cannot be taken.",
    exhausted: "You have used all the attempts allowed for this quiz.",
    inProgress: "Attempt in progress",
    submit: "Submit the quiz",
    submitNote: "Review your answers before submitting — this cannot be undone.",
    expired: "This attempt has expired",
    expiredNote:
      "The time ran out before you submitted. Close the attempt to record it; answers sent now are discarded.",
    closeAttempt: "Close the expired attempt",
    shortHint: "Short answer: graded by your instructor, never auto-scored as zero.",
    multiHint: "Select every correct answer — scoring requires an exact match.",
    singleHint: "Select one answer.",
    yourAnswer: "Your answer",
    lastResult: "Latest result",
    passed: "Passed",
    failed: "Not passed",
    pending: "Awaiting instructor grading",
    viewResult: "View result",
  },
} as const;

const cardStyle: React.CSSProperties = {
  border: "1px solid rgba(18,49,89,.12)",
  borderRadius: 16,
  background: "rgba(255,255,255,.75)",
  padding: "20px 22px",
};

export async function StudentQuizView({ lang, quizId }: { lang: Lang; quizId: string }) {
  const t = T[lang];
  const user = await currentUser();
  if (!user?.id) redirect(lang === "en" ? "/en/student-login.html" : "/student-login.html");

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: {
      id: true,
      titleAr: true,
      titleEn: true,
      descAr: true,
      descEn: true,
      courseId: true,
      visible: true,
      timeLimitMin: true,
      passScore: true,
      attemptsAllowed: true,
      retakeCooldownHours: true,
      questionPoolSize: true,
      availableAt: true,
      closesAt: true,
      shuffle: true,
      course: { select: { id: true, titleAr: true, titleEn: true, visible: true } },
    },
  });

  // اختبارٌ مخفيّ أو بلا مقرّر: نفشل مغلقين. بلا مقرّر لا يوجد شرط تسجيلٍ
  // يُتحقَّق منه، وفتحُه لكل مسجَّل دخولٍ ثغرةٌ لا ميزة.
  if (!quiz || !quiz.visible || !quiz.courseId || !quiz.course?.visible) notFound();
  if ((quiz.availableAt && quiz.availableAt > new Date()) || (quiz.closesAt && quiz.closesAt <= new Date())) notFound();
  if (!(await isEnrolled(user.id, quiz.courseId))) notFound();

  const [attempts, questionCount] = await Promise.all([
    prisma.quizAttempt.findMany({
      where: { quizId, userId: user.id },
      orderBy: { startedAt: "desc" },
      select: { id: true, startedAt: true, submittedAt: true, score: true, passed: true, questionIds: true },
    }),
    prisma.question.count({ where: { quizId } }),
  ]);

  const open = attempts.find((a) => !a.submittedAt) ?? null;
  const usedCount = attempts.filter((a) => a.submittedAt).length;
  const remaining = quiz.attemptsAllowed > 0 ? Math.max(0, quiz.attemptsAllowed - usedCount) : null;
  const lastDone = attempts.find((a) => a.submittedAt) ?? null;

  return (
    <main id="main">
      <section className="page-hero orn-navy">
        <div className="container">
          <div className="page-hero-copy reveal">
            <p className="page-kicker">{t.kicker}</p>
            <h1 className="page-title thuluth gold-text">{title(lang, quiz.titleAr, quiz.titleEn)}</h1>
            <div className="page-meta">
              <span>
                {t.course}: {title(lang, quiz.course.titleAr, quiz.course.titleEn)}
              </span>
              <span>
                {t.questions}: {num(questionCount, lang)}
              </span>
              <span>
                {t.passScore}: {num(quiz.passScore, lang)}
                {lang === "ar" ? "٪" : "%"}
              </span>
              <span>
                {t.timeLimit}:{" "}
                {quiz.timeLimitMin ? `${num(quiz.timeLimitMin, lang)} ${t.minutes}` : t.noLimit}
              </span>
              <span>
                {t.attemptsAllowed}:{" "}
                {quiz.attemptsAllowed === 0 ? t.unlimited : num(quiz.attemptsAllowed, lang)}
              </span>
            </div>
            <div className="page-actions" style={{ marginTop: 22 }}>
              <Link className="btn btn-outline-ink" href={studentHref(lang, `/course/${quiz.courseId}`)}>
                {t.backCourse}
              </Link>
              {attempts.length > 0 && (
                <Link className="btn btn-outline-ink" href={studentHref(lang, `/quiz/${quizId}/attempts`)}>
                  {t.attempts}
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="inner-section white orn-cream">
        <div className="container">
          {title(lang, quiz.descAr, quiz.descEn) && (
            <div className="callout reveal" style={{ marginBottom: 26 }}>
              <p>{title(lang, quiz.descAr, quiz.descEn)}</p>
            </div>
          )}

          {questionCount === 0 ? (
            <div className="callout reveal">
              <p>{t.empty}</p>
            </div>
          ) : open ? (
            <OpenAttempt
              lang={lang}
              quiz={quiz}
              attempt={open}
            />
          ) : (
            <StartPanel
              lang={lang}
              quizId={quizId}
              remaining={remaining}
              lastDone={lastDone}
              passScore={quiz.passScore}
            />
          )}
        </div>
      </section>
    </main>
  );
}

// ---------------------------------------------------------------------------
// لوحة البدء
// ---------------------------------------------------------------------------

function StartPanel({
  lang,
  quizId,
  remaining,
  lastDone,
  passScore,
}: {
  lang: Lang;
  quizId: string;
  remaining: number | null;
  lastDone: { id: string; score: number | null; passed: boolean | null } | null;
  passScore: number;
}) {
  const t = T[lang];
  const exhausted = remaining !== null && remaining <= 0;

  return (
    <div style={cardStyle} className="reveal">
      {lastDone && (
        <div style={{ marginBottom: 18, display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          <b style={{ color: NAVY, fontSize: 14 }}>{t.lastResult}:</b>
          {lastDone.score === null ? (
            <Pill tone="muted">{t.pending}</Pill>
          ) : (
            <>
              <Pill tone={lastDone.passed ? "gold" : "muted"}>
                {num(lastDone.score, lang)}
                {lang === "ar" ? "٪" : "%"} / {num(passScore, lang)}
                {lang === "ar" ? "٪" : "%"}
              </Pill>
              <Pill tone={lastDone.passed ? "gold" : "muted"}>
                {lastDone.passed ? t.passed : t.failed}
              </Pill>
            </>
          )}
          <Link
            className="btn btn-outline-ink"
            style={{ padding: "6px 16px", fontSize: 13 }}
            href={studentHref(lang, `/quiz/${quizId}/attempt/${lastDone.id}`)}
          >
            {t.viewResult}
          </Link>
        </div>
      )}

      {remaining !== null && (
        <p style={{ fontWeight: 800, color: NAVY, marginBottom: 10 }}>
          {t.attemptsLeft}: {num(remaining, lang)}
        </p>
      )}

      {exhausted ? (
        <p style={{ color: "#8a2b2b", fontWeight: 800 }}>{t.exhausted}</p>
      ) : (
        <form action={startQuizAttempt.bind(null, quizId)}>
          <p style={{ marginBottom: 16, lineHeight: 1.9 }}>{t.startNote}</p>
          <button className="btn btn-gold" type="submit">
            {t.start}
          </button>
        </form>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// المحاولة الجارية
// ---------------------------------------------------------------------------

async function OpenAttempt({
  lang,
  quiz,
  attempt,
}: {
  lang: Lang;
  quiz: { id: string; shuffle: boolean; timeLimitMin: number | null };
  attempt: { id: string; startedAt: Date; questionIds: unknown };
}) {
  const t = T[lang];

  // انتقاءٌ صريح للحقول: **لا `correct` ولا `explainAr/En` هنا إطلاقًا** — كل ما
  // يُقرأ في هذا الاستعلام يصل المتصفّح في حمولة RSC، فما لا يجوز كشفه لا يُقرأ.
  const selectedIds = Array.isArray(attempt.questionIds) ? attempt.questionIds.filter((x): x is string => typeof x === "string") : [];
  const questions = await prisma.question.findMany({
    where: { quizId: quiz.id, ...(selectedIds.length ? { id: { in: selectedIds } } : {}) },
    orderBy: [{ order: "asc" }, { id: "asc" }],
    select: {
      id: true,
      kind: true,
      textAr: true,
      textEn: true,
      points: true,
      choices: {
        orderBy: [{ order: "asc" }, { id: "asc" }],
        select: { id: true, textAr: true, textEn: true },
      },
    },
  });

  // بذرة الخلط هي معرّف المحاولة: ترتيبٌ ثابت في كل تحميلٍ لنفس المحاولة،
  // ومختلفٌ بين محاولةٍ وأخرى وبين طالبٍ وآخر.
  const ordered = quiz.shuffle ? shuffleWithSeed(questions, attempt.id) : questions;

  const deadline = attemptDeadline(attempt.startedAt, quiz.timeLimitMin);
  const expired = isAttemptExpired(attempt.startedAt, quiz.timeLimitMin);

  return (
    <form action={submitQuizAttempt.bind(null, lang, quiz.id, attempt.id)}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          alignItems: "center",
          marginBottom: 22,
        }}
      >
        <Pill tone="navy">{t.inProgress}</Pill>
        {deadline && <StudentQuizTimer deadlineIso={deadline.toISOString()} lang={lang} />}
      </div>

      {expired ? (
        <div className="callout reveal">
          <h3>{t.expired}</h3>
          <p>{t.expiredNote}</p>
          <div className="page-actions" style={{ marginTop: 18 }}>
            <button className="btn btn-gold" type="submit">
              {t.closeAttempt}
            </button>
          </div>
        </div>
      ) : (
        <>
          <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 18 }}>
            {ordered.map((q, i) => (
              <li key={q.id} style={cardStyle}>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 10,
                    alignItems: "baseline",
                    marginBottom: 12,
                  }}
                >
                  <Pill tone="navy">{num(i + 1, lang)}</Pill>
                  <Pill tone="muted">
                    {num(q.points, lang)} {t.points}
                  </Pill>
                </div>

                <p style={{ fontSize: 16, fontWeight: 800, color: NAVY, lineHeight: 1.9 }}>
                  {title(lang, q.textAr, q.textEn)}
                </p>

                <p style={{ fontSize: 12.5, color: "#5c6b80", margin: "6px 0 14px" }}>
                  {q.kind === "SHORT" ? t.shortHint : q.kind === "MULTI" ? t.multiHint : t.singleHint}
                </p>

                {q.kind === "SHORT" ? (
                  <label style={{ display: "block" }}>
                    <span style={{ display: "block", fontWeight: 800, fontSize: 13, marginBottom: 6, color: NAVY }}>
                      {t.yourAnswer}
                    </span>
                    <textarea
                      name={answerFieldName(q.id)}
                      rows={4}
                      dir="auto"
                      style={{
                        width: "100%",
                        borderRadius: 12,
                        border: "1px solid rgba(18,49,89,.18)",
                        padding: "10px 14px",
                        fontSize: 14.5,
                        lineHeight: 1.9,
                        background: "#fff",
                        fontFamily: "inherit",
                      }}
                    />
                  </label>
                ) : (
                  <div style={{ display: "grid", gap: 10 }}>
                    {q.choices.map((c) => (
                      <label
                        key={c.id}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 12,
                          padding: "11px 14px",
                          borderRadius: 12,
                          border: "1px solid rgba(18,49,89,.14)",
                          background: "#fff",
                          cursor: "pointer",
                          lineHeight: 1.8,
                        }}
                      >
                        <input
                          type={q.kind === "MULTI" ? "checkbox" : "radio"}
                          name={answerFieldName(q.id)}
                          value={c.id}
                          style={{ marginTop: 5, width: 17, height: 17, accentColor: "#b9862a" }}
                        />
                        <span style={{ fontWeight: 700, color: "#1c2a3d" }}>
                          {title(lang, c.textAr, c.textEn)}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ol>

          <div style={{ marginTop: 26 }}>
            <p style={{ marginBottom: 14, fontWeight: 700 }}>{t.submitNote}</p>
            <button className="btn btn-gold" type="submit">
              {t.submit}
            </button>
          </div>
        </>
      )}
    </form>
  );
}
