"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/guard";
import { isEnrolled } from "@/lib/lms";
import type { Lang } from "@/lib/site-data";
import {
  gradeQuiz,
  isSubmitTooLate,
  answerFieldName,
  type GradableQuestion,
  type QuizAnswers,
  type QuizQuestionKind,
} from "@/lib/quiz";

/**
 * إجراءات الطالب في الاختبارات والواجبات.
 *
 * القاعدة الحاكمة في هذا الملفّ كلّه: **كل إجراء يعيد التحقّق من الجلسة ومن
 * التسجيل في المقرّر بنفسه**. الـserver action نقطة دخولٍ شبكيّة مستقلّة يمكن
 * استدعاؤها بأي معرّف، وحارس `src/proxy.ts` لا يغطّي هذه المسارات، وفحصُ
 * الصفحة لا يحمي الإجراء. ولذلك تتكرّر الفحوص هنا عمدًا لا سهوًا.
 *
 * وقاعدة ثانية: **التصحيح كلّه هنا على الخادم**. لا يصل المتصفّح شيءٌ من
 * `Choice.correct` قبل التسليم، ولا تُقرأ الدرجة من أي حقلٍ يرسله.
 */

const portalPrefixes = ["/student", "/en/student"] as const;

function studentPath(lang: Lang, sub: string): string {
  return `${lang === "en" ? "/en/student" : "/student"}${sub}`;
}

// ---------------------------------------------------------------------------
// الاختبارات
// ---------------------------------------------------------------------------

/**
 * يبدأ محاولةً جديدة إن جاز ذلك. يُستدعى من زرّ داخل نموذج (يعمل بلا JavaScript)؛
 * لا يقرأ حقولًا منه، فلا يعلن معامل `FormData`.
 */
export async function startQuizAttempt(quizId: string): Promise<void> {
  const user = await currentUser();
  if (!user?.id) return;

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: { id: true, courseId: true, visible: true, attemptsAllowed: true },
  });
  // اختبارٌ مخفيّ أو بلا مقرّر لا يُبدأ: الوصول مشروطٌ بالتسجيل في مقرّرٍ بعينه،
  // فبلا مقرّر لا يوجد شرطٌ يمكن التحقّق منه — ونفشل مغلقين لا مفتوحين.
  if (!quiz || !quiz.visible || !quiz.courseId) return;
  if (!(await isEnrolled(user.id, quiz.courseId))) return;

  // محاولةٌ مفتوحة قائمة؟ لا نفتح ثانية — وإلّا التفّ الطالب على المهلة بإعادة البدء.
  const open = await prisma.quizAttempt.findFirst({
    where: { quizId, userId: user.id, submittedAt: null },
    select: { id: true },
  });
  if (open) return;

  if (quiz.attemptsAllowed > 0) {
    const used = await prisma.quizAttempt.count({
      where: { quizId, userId: user.id, submittedAt: { not: null } },
    });
    if (used >= quiz.attemptsAllowed) return;
  }

  await prisma.quizAttempt.create({ data: { quizId, userId: user.id } });
  for (const p of portalPrefixes) revalidatePath(`${p}/quiz/${quizId}`);
}

/**
 * يسلّم المحاولة ويصحّحها على الخادم.
 *
 * التسليم المتأخّر جدًّا (بعد المهلة + دقيقة تسامح للشبكة) **تُهمَل إجاباته**:
 * لو قبلناها لصار حدّ الوقت زينةً، ولأمكن لمن أبقى الصفحة مفتوحةً أن يبحث ثم
 * يسلّم. ونعلمه بذلك صراحةً في صفحة النتيجة بدل إخفاء السبب.
 */
export async function submitQuizAttempt(
  lang: Lang,
  quizId: string,
  attemptId: string,
  formData: FormData
): Promise<void> {
  const user = await currentUser();
  if (!user?.id) return;

  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    select: {
      id: true,
      quizId: true,
      userId: true,
      startedAt: true,
      submittedAt: true,
      quiz: {
        select: { id: true, courseId: true, visible: true, timeLimitMin: true, passScore: true },
      },
    },
  });

  // ملكيّة المحاولة وانتماؤها للاختبار المطلوب — لا نثق بالمعرّفات الواردة.
  if (!attempt || attempt.userId !== user.id || attempt.quizId !== quizId) return;
  if (attempt.submittedAt) redirect(studentPath(lang, `/quiz/${quizId}/attempt/${attempt.id}`));

  const quiz = attempt.quiz;
  if (!quiz.visible || !quiz.courseId) return;
  if (!(await isEnrolled(user.id, quiz.courseId))) return;

  // الإجابات الصحيحة تُقرأ هنا لأوّل مرّة — على الخادم، بعد التسليم.
  const questions = await prisma.question.findMany({
    where: { quizId },
    select: {
      id: true,
      kind: true,
      points: true,
      choices: { where: { correct: true }, select: { id: true } },
    },
  });

  const gradable: GradableQuestion[] = questions.map((q) => ({
    id: q.id,
    kind: q.kind as QuizQuestionKind,
    points: q.points,
    correctChoiceIds: q.choices.map((c) => c.id),
  }));

  const tooLate = isSubmitTooLate(attempt.startedAt, quiz.timeLimitMin);

  const answers: QuizAnswers = {};
  if (!tooLate) {
    for (const q of questions) {
      const values = formData.getAll(answerFieldName(q.id)).map((v) => String(v));
      answers[q.id] = q.kind === "SHORT" ? (values[0] ?? "") : values;
    }
  }

  const grade = gradeQuiz(gradable, answers, quiz.passScore);

  // نخزّن الإجابات مُطبَّعةً كما فهمها المصحِّح، لا كما وردت خامًا — فتُقرأ لاحقًا
  // في صفحة النتيجة بلا إعادة تفسير.
  const stored: Record<string, string[] | string> = {};
  for (const o of grade.outcomes) {
    stored[o.questionId] = o.manual ? (o.textAnswer ?? "") : o.selectedChoiceIds;
  }

  await prisma.quizAttempt.update({
    where: { id: attempt.id },
    data: {
      submittedAt: new Date(),
      answers: stored,
      score: grade.score,
      passed: grade.passed,
    },
  });

  for (const p of portalPrefixes) {
    revalidatePath(`${p}/quiz/${quizId}`);
    revalidatePath(`${p}/quiz/${quizId}/attempts`);
  }
  redirect(studentPath(lang, `/quiz/${quizId}/attempt/${attempt.id}`));
}

// ---------------------------------------------------------------------------
// الواجبات
// ---------------------------------------------------------------------------

function optionalText(v: unknown): string | null {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
}

/** رابط ملفٍّ خارجيّ بصيغة مقبولة — لا نقبل `javascript:` ولا `data:`. */
function safeLink(v: unknown): { ok: true; url: string | null } | { ok: false; error: string } {
  const s = String(v ?? "").trim();
  if (s === "") return { ok: true, url: null };
  if (!/^https?:\/\//i.test(s)) {
    return { ok: false, error: "الرابط يجب أن يبدأ بـ http:// أو https://" };
  }
  return { ok: true, url: s };
}

const ASSIGNMENT_T = {
  ar: {
    unauth: "انتهت جلستك. سجّل الدخول ثم أعد المحاولة.",
    notFound: "الواجب غير موجود أو لم يُفتح بعد.",
    graded: "صُحّح واجبك بالفعل، فلا يمكن تعديله. راجع ملاحظة المعلّم أو كلّمه.",
    empty: "اكتب نصّ الواجب أو ضع رابط ملفّك قبل التسليم.",
  },
  en: {
    unauth: "Your session has expired. Sign in and try again.",
    notFound: "This assignment does not exist or is not open yet.",
    graded: "Your work has already been graded and can no longer be edited.",
    empty: "Write your answer or add a file link before submitting.",
  },
} as const;

/**
 * يحفظ عمل الطالب مسوّدةً أو يسلّمه.
 *
 * لا نمنع التسليم بعد `dueAt` منعًا صلبًا: القرار في قبول المتأخّر إداريّ لا
 * تقنيّ، والشاشة تُعلِم الطالب أنّ الموعد انقضى، وشاشة التصحيح تُظهر «متأخّر».
 */
export async function saveAssignmentWork(
  lang: Lang,
  assignmentId: string,
  _prev: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const t = ASSIGNMENT_T[lang];
  const user = await currentUser();
  if (!user?.id) return t.unauth;

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: { id: true, courseId: true, visible: true },
  });
  if (!assignment || !assignment.visible) return t.notFound;
  if (!(await isEnrolled(user.id, assignment.courseId))) return t.notFound;

  const existing = await prisma.assignmentSubmission.findUnique({
    where: { assignmentId_userId: { assignmentId, userId: user.id } },
    select: { state: true },
  });
  // المصحَّح مُقفَل: تعديله بعد رصد الدرجة يفسد التصحيح ويخفي ما صُحّح.
  if (existing?.state === "GRADED") return t.graded;

  const link = safeLink(formData.get("fileUrl"));
  if (!link.ok) return link.error;

  const text = optionalText(formData.get("text"));
  const submit = String(formData.get("intent") ?? "") === "submit";
  if (submit && !text && !link.url) return t.empty;

  const state = submit ? "SUBMITTED" : "DRAFT";
  const payload = {
    text,
    fileUrl: link.url,
    fileName: optionalText(formData.get("fileName")),
    state: state as "SUBMITTED" | "DRAFT",
    submittedAt: submit ? new Date() : null,
  };

  await prisma.assignmentSubmission.upsert({
    where: { assignmentId_userId: { assignmentId, userId: user.id } },
    create: { assignmentId, userId: user.id, ...payload },
    update: payload,
  });

  for (const p of portalPrefixes) revalidatePath(`${p}/assignment/${assignmentId}`);
  revalidatePath(`/admin/assignments/${assignmentId}/submissions`);
  return undefined;
}
