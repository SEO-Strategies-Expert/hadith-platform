/**
 * نتيجة محاولة.
 *
 * المحاولة التي لم تُسلَّم **لا نتيجة لها**، ولا يجوز أن يكشف هذا المسار
 * إجاباتها الصحيحة — وإلّا صار بابًا خلفيًّا لرؤية الحلّ قبل التسليم.
 * ولذلك يُردّ في تلك الحالة وصفُ المحاولة الجارية بلا سؤالٍ ولا إجابة.
 */
import { requireApiStudent } from "@/lib/api-auth";
import { attemptDeadline, isAttemptExpired } from "@/lib/quiz";
import { ok, fail } from "../../../_lib";
import { cors, preflight, requireId } from "../../../_http";
import { loadAttemptForStudent, quizCard, attemptResult, attemptBrief } from "../../../_quiz-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const METHODS = "GET, OPTIONS";

export async function OPTIONS(req: Request) {
  return preflight(req, "app", METHODS);
}

export async function GET(req: Request, ctx: { params: Promise<{ attemptId: string }> }) {
  try {
    const id = await requireApiStudent(req);
    const attemptId = requireId((await ctx.params).attemptId, "معرّف المحاولة");
    const { attempt, quiz } = await loadAttemptForStudent(id.userId, attemptId);

    if (!attempt.submittedAt) {
      return cors(
        req,
        ok({
          submitted: false,
          quiz: quizCard(quiz),
          attempt: {
            ...attemptBrief(attempt),
            deadline: attemptDeadline(attempt.startedAt, quiz.timeLimitMin),
            expired: isAttemptExpired(attempt.startedAt, quiz.timeLimitMin),
          },
          result: null,
        }),
        "app",
        METHODS
      );
    }

    return cors(
      req,
      ok({
        submitted: true,
        quiz: quizCard(quiz),
        attempt: attemptBrief(attempt),
        result: await attemptResult(quiz, { ...attempt, submittedAt: attempt.submittedAt }),
      }),
      "app",
      METHODS
    );
  } catch (e) {
    return cors(req, fail(e), "app", METHODS);
  }
}
