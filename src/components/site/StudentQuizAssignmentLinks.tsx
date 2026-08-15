/**
 * قسم «الاختبارات والواجبات» داخل صفحة المقرّر في بوابة الطالب.
 *
 * مكوّنٌ مستقلّ لا تعديلٌ في `StudentCourseView` عمدًا: ملفّ صفحة المقرّر يملكه
 * عملٌ آخر، فأُخرج القسم كتلةً واحدة تُركَّب بسطرٍ واحد.
 *
 * ويتحقّق من التسجيل بنفسه ولا يتّكل على الصفحة المستضيفة — التكرار هنا رخيص،
 * وثمن الاتّكال أن ينكشف محتوى مقرّر لغير طالبه إن رُكّب المكوّن في مكانٍ آخر.
 */
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/guard";
import type { Lang } from "@/lib/site-data";
import { isEnrolled, title } from "@/lib/lms";
import { Pill, studentHref, num, NAVY } from "@/components/site/StudentPortalKit";

const T = {
  ar: {
    heading: "الاختبارات والواجبات",
    quizzes: "الاختبارات",
    assignments: "الواجبات",
    empty: "لا اختبارات ولا واجبات في هذا المقرّر بعد.",
    questions: "سؤال",
    passScore: "النجاح",
    minutes: "دقيقة",
    noLimit: "بلا توقيت",
    open: "افتح",
    notTaken: "لم تُؤدَّ بعد",
    inProgress: "محاولة جارية",
    passed: "ناجح",
    failed: "راسب",
    pendingScore: "بانتظار التصحيح",
    best: "أفضل نتيجة",
    due: "الموعد",
    noDue: "بلا موعد",
    overdue: "انقضى",
    maxScore: "الدرجة",
    states: {
      DRAFT: "مسوّدة",
      SUBMITTED: "مُسلَّم",
      RETURNED: "أُعيد للتعديل",
      GRADED: "مُصحَّح",
    } as Record<string, string>,
    notSubmitted: "لم يُسلَّم",
  },
  en: {
    heading: "Quizzes and assignments",
    quizzes: "Quizzes",
    assignments: "Assignments",
    empty: "This course has no quizzes or assignments yet.",
    questions: "questions",
    passScore: "Pass",
    minutes: "min",
    noLimit: "No time limit",
    open: "Open",
    notTaken: "Not attempted",
    inProgress: "In progress",
    passed: "Passed",
    failed: "Not passed",
    pendingScore: "Awaiting grading",
    best: "Best score",
    due: "Due",
    noDue: "No deadline",
    overdue: "Overdue",
    maxScore: "Score",
    states: {
      DRAFT: "Draft",
      SUBMITTED: "Submitted",
      RETURNED: "Returned",
      GRADED: "Graded",
    } as Record<string, string>,
    notSubmitted: "Not submitted",
  },
} as const;

const rowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 12,
  alignItems: "center",
  justifyContent: "space-between",
  border: "1px solid rgba(18,49,89,.12)",
  borderRadius: 14,
  background: "rgba(255,255,255,.72)",
  padding: "14px 18px",
};

/**
 * قراءة اختبارات المقرّر وواجباته بحالة هذا الطالب فيها.
 * خارج المكوّن عمدًا: قراءة الساعة أثر جانبيّ لا يجوز في جسم مكوّن React.
 */
async function loadCourseWork(userId: string, courseId: string) {
  const [quizzes, assignments] = await Promise.all([
    prisma.quiz.findMany({
      where: { courseId, visible: true },
      orderBy: { titleAr: "asc" },
      select: {
        id: true,
        titleAr: true,
        titleEn: true,
        passScore: true,
        timeLimitMin: true,
        _count: { select: { questions: true } },
        // محاولات هذا الطالب وحده — بلا إجابات ولا حلول.
        attempts: {
          where: { userId },
          orderBy: { startedAt: "desc" },
          select: { submittedAt: true, score: true, passed: true },
        },
      },
    }),
    prisma.assignment.findMany({
      where: { courseId, visible: true },
      orderBy: [{ order: "asc" }, { titleAr: "asc" }],
      select: {
        id: true,
        titleAr: true,
        titleEn: true,
        dueAt: true,
        maxScore: true,
        submissions: {
          where: { userId },
          select: { state: true, score: true },
        },
      },
    }),
  ]);

  const now = Date.now();
  return {
    // اختبارٌ بلا أسئلة لا يُعرض للطالب: فتحُه يوقعه في شاشة فارغة بلا فائدة.
    quizzes: quizzes.filter((q) => q._count.questions > 0),
    assignments: assignments.map((a) => ({
      ...a,
      overdue: a.dueAt ? a.dueAt.getTime() < now : false,
    })),
  };
}

export async function StudentQuizAssignmentLinks({
  lang,
  courseId,
}: {
  lang: Lang;
  courseId: string;
}) {
  const t = T[lang];
  const user = await currentUser();
  if (!user?.id) return null;
  if (!(await isEnrolled(user.id, courseId))) return null;

  const { quizzes: shown, assignments } = await loadCourseWork(user.id, courseId);
  if (shown.length === 0 && assignments.length === 0) return null;

  const fmtDate = (d: Date) =>
    new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "ar-QA", { dateStyle: "medium" }).format(d);

  return (
    <section className="inner-section white orn-cream">
      <div className="container">
        <header className="section-cap reveal">
          <h2 className="thuluth">{t.heading}</h2>
        </header>

        {shown.length > 0 && (
          <>
            <h3 style={{ color: NAVY, fontSize: 16, fontWeight: 800, margin: "0 0 12px" }}>
              {t.quizzes}
            </h3>
            <ul style={{ listStyle: "none", margin: "0 0 28px", padding: 0, display: "grid", gap: 12 }}>
              {shown.map((q) => {
                const open = q.attempts.find((a) => !a.submittedAt);
                const done = q.attempts.filter((a) => a.submittedAt);
                const scored = done.filter((a) => a.score !== null);
                const best = scored.length
                  ? scored.reduce((m, a) => (a.score! > (m.score ?? -1) ? a : m), scored[0])
                  : null;

                return (
                  <li key={q.id} style={rowStyle}>
                    <div style={{ minWidth: 0 }}>
                      <b style={{ color: NAVY, fontSize: 15 }}>{title(lang, q.titleAr, q.titleEn)}</b>
                      <div style={{ fontSize: 12.5, color: "#5c6b80", marginTop: 4 }}>
                        {num(q._count.questions, lang)} {t.questions} — {t.passScore}{" "}
                        {num(q.passScore, lang)}
                        {lang === "ar" ? "٪" : "%"} —{" "}
                        {q.timeLimitMin
                          ? `${num(q.timeLimitMin, lang)} ${t.minutes}`
                          : t.noLimit}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                      {open ? (
                        <Pill tone="gold">{t.inProgress}</Pill>
                      ) : done.length === 0 ? (
                        <Pill tone="muted">{t.notTaken}</Pill>
                      ) : best ? (
                        <>
                          <Pill tone="navy">
                            {t.best}: {num(best.score!, lang)}
                            {lang === "ar" ? "٪" : "%"}
                          </Pill>
                          <Pill tone={best.passed ? "gold" : "muted"}>
                            {best.passed ? t.passed : t.failed}
                          </Pill>
                        </>
                      ) : (
                        <Pill tone="muted">{t.pendingScore}</Pill>
                      )}
                      <Link
                        className="btn btn-gold"
                        style={{ padding: "6px 18px", fontSize: 13 }}
                        href={studentHref(lang, `/quiz/${q.id}`)}
                      >
                        {t.open}
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {assignments.length > 0 && (
          <>
            <h3 style={{ color: NAVY, fontSize: 16, fontWeight: 800, margin: "0 0 12px" }}>
              {t.assignments}
            </h3>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 12 }}>
              {assignments.map((a) => {
                const mine = a.submissions[0] ?? null;
                const overdue = a.overdue;
                return (
                  <li key={a.id} style={rowStyle}>
                    <div style={{ minWidth: 0 }}>
                      <b style={{ color: NAVY, fontSize: 15 }}>{title(lang, a.titleAr, a.titleEn)}</b>
                      <div style={{ fontSize: 12.5, color: "#5c6b80", marginTop: 4 }}>
                        {t.due}: {a.dueAt ? fmtDate(a.dueAt) : t.noDue}
                        {overdue ? ` — ${t.overdue}` : ""} — {t.maxScore} {num(a.maxScore, lang)}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                      {mine ? (
                        <Pill tone={mine.state === "GRADED" ? "gold" : "navy"}>
                          {t.states[mine.state] ?? mine.state}
                          {mine.state === "GRADED" && mine.score !== null
                            ? `: ${num(mine.score, lang)} / ${num(a.maxScore, lang)}`
                            : ""}
                        </Pill>
                      ) : (
                        <Pill tone="muted">{t.notSubmitted}</Pill>
                      )}
                      <Link
                        className="btn btn-gold"
                        style={{ padding: "6px 18px", fontSize: 13 }}
                        href={studentHref(lang, `/assignment/${a.id}`)}
                      >
                        {t.open}
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}
