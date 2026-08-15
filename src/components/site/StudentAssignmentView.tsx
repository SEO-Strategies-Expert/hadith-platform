/**
 * صفحة الواجب في بوابة الطالب: العرض والتسليم والدرجة.
 *
 * الحارس هنا هو الحارس الحقيقي — `src/proxy.ts` لا يغطّي المسارات الفرعيّة —
 * ويتكرّر في `saveAssignmentWork` لأنّ الإجراء نقطة دخولٍ مستقلّة.
 *
 * انقضاء الموعد **لا يمنع التسليم**: القرار في قبول المتأخّر إداريّ لا تقنيّ،
 * فنُعلم الطالب ونُعلّم التسليم متأخّرًا في شاشة التصحيح، ونترك الحكم للإدارة.
 */
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/guard";
import type { Lang } from "@/lib/site-data";
import { isEnrolled, title } from "@/lib/lms";
import { mediaUrl } from "@/lib/site-format";
import { saveAssignmentWork } from "@/app/(site)/student-quiz-actions";
import { Pill, studentHref, num, NAVY } from "@/components/site/StudentPortalKit";
import { StudentAssignmentForm } from "@/components/site/StudentAssignmentForm";

const T = {
  ar: {
    kicker: "واجب",
    course: "المقرّر",
    backCourse: "عودة إلى المقرّر",
    due: "الموعد النهائي",
    noDue: "بلا موعد نهائي",
    maxScore: "الدرجة القصوى",
    overdue: "انقضى الموعد النهائي لهذا الواجب. ما زال التسليم متاحًا، ويُعلَّم «متأخّرًا» عند المصحِّح، والقرار في قبوله للإدارة.",
    stateLabel: "حالة واجبك",
    states: {
      DRAFT: "مسوّدة محفوظة (لم تُسلَّم)",
      SUBMITTED: "مُسلَّم — بانتظار التصحيح",
      RETURNED: "أُعيد إليك للتعديل",
      GRADED: "مُصحَّح",
    } as Record<string, string>,
    notStarted: "لم تبدأ هذا الواجب بعد.",
    submittedAt: "وقت التسليم",
    grade: "درجتك",
    feedback: "ملاحظة المعلّم",
    gradedNote: "صُحّح واجبك، فلم يعد قابلًا للتعديل. إن كان لديك اعتراض فراجع معلّمك.",
    returnedNote: "أعاد المعلّم واجبك للتعديل. عدّله ثم سلّمه مرّةً أخرى.",
    yourWork: "ما سلّمته",
    fileLink: "الملفّ المرفق",
    noText: "لا نصّ مكتوب.",
    instructions: "نصّ الواجب",
    noInstructions: "لم يُكتب نصّ هذا الواجب بعد — راجع معلّمك.",
  },
  en: {
    kicker: "Assignment",
    course: "Course",
    backCourse: "Back to course",
    due: "Due",
    noDue: "No deadline",
    maxScore: "Maximum score",
    overdue: "The deadline has passed. Submission is still open and will be flagged as late; acceptance is up to the administration.",
    stateLabel: "Your status",
    states: {
      DRAFT: "Draft saved (not submitted)",
      SUBMITTED: "Submitted — awaiting grading",
      RETURNED: "Returned to you for revision",
      GRADED: "Graded",
    } as Record<string, string>,
    notStarted: "You have not started this assignment yet.",
    submittedAt: "Submitted at",
    grade: "Your score",
    feedback: "Instructor feedback",
    gradedNote: "Your work has been graded and can no longer be edited. Contact your instructor with any questions.",
    returnedNote: "Your instructor returned this for revision. Edit it and submit again.",
    yourWork: "What you submitted",
    fileLink: "Attached file",
    noText: "No written text.",
    instructions: "Assignment brief",
    noInstructions: "The brief for this assignment has not been written yet — ask your instructor.",
  },
} as const;

const cardStyle: React.CSSProperties = {
  border: "1px solid rgba(18,49,89,.12)",
  borderRadius: 16,
  background: "rgba(255,255,255,.75)",
  padding: "20px 22px",
};

/**
 * قراءة الواجب وتسليم الطالب، مع الفحص الأمني.
 * خارج المكوّن عمدًا: قراءة الساعة أثر جانبيّ لا يجوز في جسم مكوّن React.
 * يعيد `null` لما لا يجوز للطالب رؤيته — القرار في العرض للمكوّن.
 */
async function loadAssignment(userId: string, assignmentId: string) {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: {
      id: true,
      titleAr: true,
      titleEn: true,
      descAr: true,
      descEn: true,
      courseId: true,
      visible: true,
      dueAt: true,
      maxScore: true,
      course: { select: { titleAr: true, titleEn: true, visible: true } },
    },
  });
  if (!assignment || !assignment.visible || !assignment.course?.visible) return null;
  if (!(await isEnrolled(userId, assignment.courseId))) return null;

  const submission = await prisma.assignmentSubmission.findUnique({
    where: { assignmentId_userId: { assignmentId, userId } },
    select: {
      text: true,
      fileUrl: true,
      fileName: true,
      state: true,
      submittedAt: true,
      score: true,
      feedback: true,
      gradedAt: true,
    },
  });

  return {
    assignment,
    submission,
    overdue: assignment.dueAt ? assignment.dueAt.getTime() < Date.now() : false,
  };
}

export async function StudentAssignmentView({
  lang,
  assignmentId,
}: {
  lang: Lang;
  assignmentId: string;
}) {
  const t = T[lang];
  const user = await currentUser();
  if (!user?.id) redirect(lang === "en" ? "/en/student-login.html" : "/student-login.html");

  const data = await loadAssignment(user.id, assignmentId);
  // غير المسجَّل لا يُعلَم بوجود الواجب أصلًا — نفس جواب «غير موجود».
  if (!data) notFound();
  const { assignment, submission, overdue } = data;

  const locked = submission?.state === "GRADED";
  const brief = title(lang, assignment.descAr, assignment.descEn);

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
            <h1 className="page-title thuluth gold-text">
              {title(lang, assignment.titleAr, assignment.titleEn)}
            </h1>
            <div className="page-meta">
              <span>
                {t.course}: {title(lang, assignment.course.titleAr, assignment.course.titleEn)}
              </span>
              <span>
                {t.due}: {assignment.dueAt ? fmt(assignment.dueAt) : t.noDue}
              </span>
              <span>
                {t.maxScore}: {num(assignment.maxScore, lang)}
              </span>
            </div>
            <div className="page-actions" style={{ marginTop: 22 }}>
              <Link
                className="btn btn-outline-ink"
                href={studentHref(lang, `/course/${assignment.courseId}`)}
              >
                {t.backCourse}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="inner-section white orn-cream">
        <div className="container">
          <div className="callout reveal" style={{ marginBottom: 22 }}>
            <h3>{t.instructions}</h3>
            <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.95 }}>{brief || t.noInstructions}</p>
          </div>

          {overdue && !locked && (
            <p
              style={{
                borderRadius: 12,
                border: "1px solid rgba(217,174,75,.55)",
                background: "rgba(217,174,75,.12)",
                color: "#8a6a1c",
                fontWeight: 800,
                padding: "12px 18px",
                lineHeight: 1.9,
                marginBottom: 22,
              }}
            >
              {t.overdue}
            </p>
          )}

          <div style={{ ...cardStyle, marginBottom: 22 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
              <b style={{ color: NAVY, fontSize: 14 }}>{t.stateLabel}:</b>
              {submission ? (
                <Pill tone={submission.state === "GRADED" ? "gold" : "navy"}>
                  {t.states[submission.state] ?? submission.state}
                </Pill>
              ) : (
                <Pill tone="muted">{t.notStarted}</Pill>
              )}
              {submission?.submittedAt && (
                <Pill tone="muted">
                  {t.submittedAt}: {fmt(submission.submittedAt)}
                </Pill>
              )}
            </div>

            {submission?.state === "GRADED" && (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
                  <span style={{ fontWeight: 800, color: NAVY }}>{t.grade}:</span>
                  <span style={{ fontSize: 30, fontWeight: 900, color: NAVY, lineHeight: 1 }}>
                    {submission.score === null
                      ? "—"
                      : `${num(submission.score, lang)} / ${num(assignment.maxScore, lang)}`}
                  </span>
                </div>
                {submission.feedback && (
                  <div
                    style={{
                      marginTop: 14,
                      padding: "12px 16px",
                      borderRadius: 12,
                      background: "rgba(217,174,75,.10)",
                      border: "1px solid rgba(217,174,75,.35)",
                    }}
                  >
                    <b style={{ fontSize: 13, color: "#8a6a1c" }}>{t.feedback}:</b>
                    {/* ملاحظة المعلّم نصٌّ صِرف لا HTML. */}
                    <p style={{ marginTop: 5, whiteSpace: "pre-wrap", lineHeight: 1.95 }}>
                      {submission.feedback}
                    </p>
                  </div>
                )}
                <p style={{ marginTop: 14, color: "#5c6b80", fontWeight: 700, lineHeight: 1.9 }}>
                  {t.gradedNote}
                </p>
              </div>
            )}

            {submission?.state === "RETURNED" && (
              <>
                {submission.feedback && (
                  <div
                    style={{
                      marginTop: 14,
                      padding: "12px 16px",
                      borderRadius: 12,
                      background: "rgba(217,174,75,.10)",
                      border: "1px solid rgba(217,174,75,.35)",
                    }}
                  >
                    <b style={{ fontSize: 13, color: "#8a6a1c" }}>{t.feedback}:</b>
                    <p style={{ marginTop: 5, whiteSpace: "pre-wrap", lineHeight: 1.95 }}>
                      {submission.feedback}
                    </p>
                  </div>
                )}
                <p style={{ marginTop: 14, color: "#5c6b80", fontWeight: 700, lineHeight: 1.9 }}>
                  {t.returnedNote}
                </p>
              </>
            )}
          </div>

          {locked ? (
            <div style={cardStyle}>
              <h3 style={{ color: NAVY, marginBottom: 10 }}>{t.yourWork}</h3>
              <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.95 }}>{submission.text || t.noText}</p>
              {submission.fileUrl && (
                <p style={{ marginTop: 12 }}>
                  <a
                    className="btn btn-outline-ink"
                    style={{ padding: "6px 16px", fontSize: 13 }}
                    href={mediaUrl(submission.fileUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {submission.fileName || t.fileLink}
                  </a>
                </p>
              )}
            </div>
          ) : (
            <div style={cardStyle}>
              <StudentAssignmentForm
                action={saveAssignmentWork.bind(null, lang, assignmentId)}
                lang={lang}
                defaults={{
                  text: submission?.text ?? null,
                  fileUrl: submission?.fileUrl ?? null,
                  fileName: submission?.fileName ?? null,
                }}
              />
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
