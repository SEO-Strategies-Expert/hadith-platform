/**
 * تسليم محاولة وتصحيحها.
 *
 * **التصحيح كلّه على الخادم** بـ`gradeQuiz`، ولا يُقرأ من جسم الطلب إلّا
 * اختيارات الطالب. لا درجة ولا نسبة ولا «passed» يُقبل من العميل بحال.
 *
 * والتسليم المتأخّر جدًّا (بعد المهلة + دقيقة تسامحٍ للشبكة) **تُهمَل إجاباته**
 * وتُغلق المحاولة: لو قبلناها لصار حدّ الوقت زينةً، ولأمكن لمن أبقى الشاشة
 * مفتوحةً أن يبحث ثمّ يسلّم.
 */
import { prisma } from "@/lib/prisma";
import { requireApiUser, ApiError } from "@/lib/api-auth";
import { gradeQuiz, isSubmitTooLate, type QuizAnswers } from "@/lib/quiz";
import { ok, fail, body } from "../../../../_lib";
import { cors, preflight, requireId } from "../../../../_http";
import { loadAttemptForStudent, gradableQuestions, quizCard, attemptResult } from "../../../../_quiz-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const METHODS = "POST, OPTIONS";

export async function OPTIONS(req: Request) {
  return preflight(req, "app", METHODS);
}

/** يطهّر إجابات العميل: مفاتيح نصّيّة وقيمٌ نصّيّة أو قائمة نصوص، لا غير. */
function sanitize(raw: unknown): QuizAnswers {
  const out: QuizAnswers = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (v == null) continue;
    if (Array.isArray(v)) out[k] = v.filter((x) => typeof x === "string" || typeof x === "number").map(String);
    else if (typeof v === "string" || typeof v === "number") out[k] = String(v);
    // أي شكلٍ آخر (كائن، منطقيّ) يُسقَط: لا معنى له في إجابةٍ ولا نحاول تأويله.
  }
  return out;
}

export async function POST(req: Request, ctx: { params: Promise<{ attemptId: string }> }) {
  try {
    const id = await requireApiUser(req);
    const attemptId = requireId((await ctx.params).attemptId, "معرّف المحاولة");
    const { attempt, quiz } = await loadAttemptForStudent(id.userId, attemptId);

    // تسليمٌ مكرّر: نعيد النتيجة القائمة بدل خطأ — الشبكة قد تُسقط ردّ التسليم
    // الأوّل فيعيد التطبيق الطلب، ولا يجوز أن يفهم ذلك خسارةً للمحاولة.
    if (attempt.submittedAt) {
      return cors(
        req,
        ok({
          alreadySubmitted: true,
          quiz: quizCard(quiz),
          result: await attemptResult(quiz, { ...attempt, submittedAt: attempt.submittedAt }),
        }),
        "app",
        METHODS
      );
    }

    const b = await body<{ answers?: unknown }>(req);
    const gradable = await gradableQuestions(quiz.id);
    if (!gradable.length) throw new ApiError(409, "لا أسئلة في هذا الاختبار");

    const tooLate = isSubmitTooLate(attempt.startedAt, quiz.timeLimitMin);
    const answers: QuizAnswers = tooLate ? {} : sanitize(b.answers);

    const grade = gradeQuiz(gradable, answers, quiz.passScore);

    // نخزّن الإجابات مُطبَّعةً كما فهمها المصحِّح لا كما وردت خامًّا، فتُقرأ
    // لاحقًا في مسار النتيجة بلا إعادة تأويل — وهو نفس ما تفعله بوابة الويب.
    const stored: Record<string, string[] | string> = {};
    for (const o of grade.outcomes) {
      stored[o.questionId] = o.manual ? (o.textAnswer ?? "") : o.selectedChoiceIds;
    }

    const saved = await prisma.quizAttempt.update({
      where: { id: attempt.id },
      data: {
        submittedAt: new Date(),
        answers: stored,
        score: grade.score,
        passed: grade.passed,
      },
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

    return cors(
      req,
      ok({
        alreadySubmitted: false,
        quiz: quizCard(quiz),
        result: await attemptResult(quiz, { ...saved, submittedAt: saved.submittedAt ?? new Date() }),
      }),
      "app",
      METHODS
    );
  } catch (e) {
    return cors(req, fail(e), "app", METHODS);
  }
}
