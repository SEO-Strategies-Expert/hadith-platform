/**
 * بدء محاولة في اختبار.
 *
 * ثلاثة قيود، وكلّها على الخادم:
 *  ١) **محاولة واحدة مفتوحة**. لو سمحنا بثانية لالتفّ الطالب على المهلة
 *     بإعادة البدء كلّما قاربت على الانتهاء. ولذلك نُرجع الجارية نفسها
 *     (`resumed: true`) بدل أن نُخفق: التطبيق قد يفقد الاتّصال بعد الإنشاء
 *     ويعيد الطلب، فإخفاقُنا حينئذٍ يحبس الطالب خارج محاولته.
 *  ٢) رصيد المحاولات يُحسب من **المُسلَّمة** وحدها.
 *  ٣) لحظة البدء `startedAt` من القاعدة لا من العميل — عليها تُبنى المهلة كلّها.
 */
import { prisma } from "@/lib/prisma";
import { requireApiStudent, ApiError } from "@/lib/api-auth";
import { ok, fail } from "../../../../_lib";
import { cors, preflight, requireId } from "../../../../_http";
import { loadQuizForStudent, quizCard, openAttemptPayload } from "../../../../_quiz-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const METHODS = "POST, OPTIONS";

export async function OPTIONS(req: Request) {
  return preflight(req, "app", METHODS);
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const id = await requireApiStudent(req);
    const quizId = requireId((await ctx.params).id, "معرّف الاختبار");
    const quiz = await loadQuizForStudent(id.userId, quizId);

    const open = await prisma.quizAttempt.findFirst({
      where: { quizId, userId: id.userId, submittedAt: null },
      orderBy: { startedAt: "desc" },
      select: { id: true, startedAt: true, submittedAt: true, score: true, passed: true },
    });
    if (open) {
      return cors(
        req,
        ok({ resumed: true, quiz: quizCard(quiz), attempt: await openAttemptPayload(quiz, open) }),
        "app",
        METHODS
      );
    }

    const questionCount = await prisma.question.count({ where: { quizId } });
    // اختبارٌ بلا أسئلة لا يُبدأ — وإلّا سُجّلت محاولةٌ فارغة تُحسب من رصيده.
    if (questionCount === 0) throw new ApiError(409, "لم تُضَف أسئلة لهذا الاختبار بعد");

    if (quiz.attemptsAllowed > 0) {
      const used = await prisma.quizAttempt.count({
        where: { quizId, userId: id.userId, submittedAt: { not: null } },
      });
      if (used >= quiz.attemptsAllowed) {
        throw new ApiError(409, "استنفدت عدد المحاولات المسموحة في هذا الاختبار");
      }
    }

    const attempt = await prisma.quizAttempt.create({
      data: { quizId, userId: id.userId },
      select: { id: true, startedAt: true, submittedAt: true, score: true, passed: true },
    });

    return cors(
      req,
      ok(
        { resumed: false, quiz: quizCard(quiz), attempt: await openAttemptPayload(quiz, attempt) },
        { status: 201 }
      ),
      "app",
      METHODS
    );
  } catch (e) {
    return cors(req, fail(e), "app", METHODS);
  }
}
