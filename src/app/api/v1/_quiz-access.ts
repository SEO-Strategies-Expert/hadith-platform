/**
 * حراسة الاختبارات ومنطقها المشترك بين مسارات التطبيق.
 *
 * جُمع هنا لأنّ ثلاثة مسارات (عرض الاختبار، بدء محاولة، التسليم، والنتيجة)
 * تحتاج **نفس** الفحص بالضبط، وتكرارُه أربع مرّات يعني أن يُنسى في واحدة.
 *
 * القاعدة المحكومة هنا:
 *  ١) الاختبار المخفيّ، أو الذي بلا مقرّر، لا يُفتح لأحد. بلا مقرّر لا يوجد
 *     شرط تسجيلٍ يُتحقَّق منه، وفتحُه لكل مسجَّل دخولٍ ثغرةٌ لا ميزة.
 *  ٢) قبل التسليم **لا تُقرأ** `Choice.correct` ولا `Question.explainAr/En`
 *     من القاعدة أصلًا. ما لا يُقرأ لا يُسرَّب سهوًا.
 */
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-auth";
import { isEnrolled } from "@/lib/lms";
import {
  attemptDeadline,
  isAttemptExpired,
  isSubmitTooLate,
  gradeQuiz,
  shuffleWithSeed,
  type GradableQuestion,
  type QuizAnswers,
  type QuizQuestionKind,
} from "@/lib/quiz";
import { safeQuestion, revealedQuestion } from "./_dto";

/** يحمّل الاختبار ويفحص ظهوره وارتباطه بمقرّرٍ الطالبُ مسجَّل فيه. */
export async function loadQuizForStudent(userId: string, quizId: string) {
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
      shuffle: true,
      course: { select: { id: true, titleAr: true, titleEn: true, visible: true } },
    },
  });

  if (!quiz || !quiz.visible || !quiz.courseId || !quiz.course?.visible) {
    throw new ApiError(404, "الاختبار غير موجود");
  }
  if (!(await isEnrolled(userId, quiz.courseId))) {
    // ٤٠٤ لا ٤٠٣ — لا نؤكّد وجود اختبارٍ لمن ليس من أهله.
    throw new ApiError(404, "الاختبار غير موجود أو لست مسجَّلًا في مقرّره");
  }
  return quiz;
}

export type StudentQuiz = Awaited<ReturnType<typeof loadQuizForStudent>>;

/** بطاقة الاختبار كما تُعرض في التطبيق — بلا حقول القاعدة الداخليّة. */
export function quizCard(q: StudentQuiz) {
  return {
    id: q.id,
    titleAr: q.titleAr,
    titleEn: q.titleEn,
    descAr: q.descAr,
    descEn: q.descEn,
    timeLimitMin: q.timeLimitMin,
    passScore: q.passScore,
    attemptsAllowed: q.attemptsAllowed,
    course: q.course
      ? { id: q.course.id, titleAr: q.course.titleAr, titleEn: q.course.titleEn }
      : null,
  };
}

/**
 * أسئلة الاختبار **بلا إجابات صحيحة ولا شروح** — للعرض قبل التسليم.
 * الانتقاء صريح: لا `correct` في `choices` ولا `explainAr/En` في السؤال.
 */
export async function questionsWithoutAnswers(quizId: string) {
  return prisma.question.findMany({
    where: { quizId },
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
}

/** الأسئلة بصورتها اللازمة للتصحيح — تُقرأ على الخادم وقت التسليم وحده. */
export async function gradableQuestions(quizId: string): Promise<GradableQuestion[]> {
  const rows = await prisma.question.findMany({
    where: { quizId },
    select: {
      id: true,
      kind: true,
      points: true,
      choices: { where: { correct: true }, select: { id: true } },
    },
  });
  return rows.map((q) => ({
    id: q.id,
    kind: q.kind as QuizQuestionKind,
    points: q.points,
    correctChoiceIds: q.choices.map((c) => c.id),
  }));
}

export interface AttemptRow {
  id: string;
  startedAt: Date;
  submittedAt: Date | null;
  score: number | null;
  passed: boolean | null;
}

export function attemptBrief(a: AttemptRow) {
  return {
    id: a.id,
    startedAt: a.startedAt,
    submittedAt: a.submittedAt,
    score: a.score,
    passed: a.passed,
  };
}

/**
 * حمولة المحاولة الجارية: الأسئلة مرتَّبةً والمهلة محسوبةً **على الخادم**.
 *
 * بذرة الخلط هي معرّف المحاولة، فالترتيب ثابتٌ في كل نداءٍ لنفس المحاولة
 * ومختلفٌ بين محاولةٍ وأخرى — وإلّا اختلف الترتيب بين إعادة فتحٍ وأخرى فأربك
 * الطالب وأفسد مطابقة إجاباته المحفوظة محلّيًّا.
 */
export async function openAttemptPayload(quiz: StudentQuiz, attempt: AttemptRow) {
  const questions = await questionsWithoutAnswers(quiz.id);
  const ordered = quiz.shuffle ? shuffleWithSeed(questions, attempt.id) : questions;
  const deadline = attemptDeadline(attempt.startedAt, quiz.timeLimitMin);

  return {
    ...attemptBrief(attempt),
    // المهلة تُرسل لحظةً مطلقة لا عدّادًا: ساعة الجهاز قد تكون مضبوطةً خطأً،
    // والحكم في التسليم لساعة الخادم على كل حال.
    deadline,
    expired: isAttemptExpired(attempt.startedAt, quiz.timeLimitMin),
    questions: ordered.map(safeQuestion),
  };
}

// ---------------------------------------------------------------------------
// المحاولة: التحميل والنتيجة
// ---------------------------------------------------------------------------

export interface StoredAttempt extends AttemptRow {
  quizId: string;
  userId: string;
  answers: unknown;
}

/**
 * يحمّل محاولةً بعد التحقّق من **ملكيّتها** ثمّ من صلاحيّة الوصول لاختبارها.
 * الملكيّة أوّلًا: محاولة طالبٍ آخر لا تُعرض ولا يُكشف وجودها.
 */
export async function loadAttemptForStudent(userId: string, attemptId: string) {
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
    },
  });
  if (!attempt || attempt.userId !== userId) throw new ApiError(404, "المحاولة غير موجودة");

  const quiz = await loadQuizForStudent(userId, attempt.quizId);
  return { attempt: attempt as StoredAttempt, quiz };
}

/**
 * نتيجة محاولةٍ **مُسلَّمة**: هنا وحده تُقرأ `Choice.correct` و`explainAr/En`.
 *
 * يُعاد التصحيح للعرض التفصيليّ فقط؛ **الدرجة المعتمدة هي `attempt.score`**
 * المخزَّنة وقت التسليم، فلا يتغيّر ما ناله الطالب لو عُدّلت الأسئلة بعد ذلك.
 */
export async function attemptResult(
  quiz: StudentQuiz,
  attempt: StoredAttempt & { submittedAt: Date }
) {
  const questions = await prisma.question.findMany({
    where: { quizId: quiz.id },
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

  const detail = gradeQuiz(gradable, answers, quiz.passScore);
  const byId = new Map(detail.outcomes.map((o) => [o.questionId, o]));

  return {
    ...attemptBrief(attempt),
    // وصل التسليم بعد المهلة + التسامح ⇒ أُهملت الإجابات. نُصرّح بذلك بدل
    // إخفاء السبب، فيعرف الطالب لماذا نتيجته صفر ويراجع معلّمه إن كان له عذر.
    late: isSubmitTooLate(attempt.startedAt, quiz.timeLimitMin, attempt.submittedAt),
    autoPoints: detail.autoPoints,
    earnedPoints: detail.earnedPoints,
    manualPoints: detail.manualPoints,
    needsManualReview: detail.needsManualReview,
    questions: questions.map((q) => revealedQuestion(q, byId.get(q.id))),
  };
}
