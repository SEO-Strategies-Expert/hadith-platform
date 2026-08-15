/**
 * شاشة الاختبار: بياناته، ورصيد المحاولات، والمحاولة الجارية إن وُجدت.
 *
 * الأسئلة لا تُرسل إلّا مع محاولةٍ **مفتوحة**. سردُها بلا محاولة يعطي بنكَ
 * الأسئلة لمن لم يبدأ بعد، فيدرسه ثمّ يبدأ والمهلة تجري وهو مستعدّ.
 * وعلى كل حال: لا `correct` ولا `explain` في أيّ فرعٍ من هذا المسار.
 */
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/api-auth";
import { ok, fail } from "../../../_lib";
import { cors, preflight, requireId } from "../../../_http";
import { loadQuizForStudent, quizCard, openAttemptPayload, attemptBrief } from "../../../_quiz-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const METHODS = "GET, OPTIONS";

export async function OPTIONS(req: Request) {
  return preflight(req, "app", METHODS);
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const id = await requireApiUser(req);
    const quizId = requireId((await ctx.params).id, "معرّف الاختبار");
    const quiz = await loadQuizForStudent(id.userId, quizId);

    const [attempts, questionCount, used] = await Promise.all([
      prisma.quizAttempt.findMany({
        where: { quizId, userId: id.userId },
        orderBy: { startedAt: "desc" },
        // سقفٌ صلب: سجلّ المحاولات قد يطول، ولا تُعرض منه في التطبيق إلّا الأخيرة.
        take: 25,
        select: { id: true, startedAt: true, submittedAt: true, score: true, passed: true },
      }),
      prisma.question.count({ where: { quizId } }),
      // الرصيد يُعدّ من القاعدة لا من القائمة المقصوصة أعلاه — وإلّا مُنح طالبٌ
      // تجاوز الخمس والعشرين محاولةً محاولاتٍ إضافيّة من حيث لا يُقصد.
      prisma.quizAttempt.count({ where: { quizId, userId: id.userId, submittedAt: { not: null } } }),
    ]);

    const open = attempts.find((a) => !a.submittedAt) ?? null;
    const done = attempts.filter((a) => a.submittedAt);
    // `attemptsAllowed = 0` تعني «بلا حدّ» في المخطّط، فنُعبّر عنها بـnull لا بصفر.
    const attemptsLeft =
      quiz.attemptsAllowed > 0 ? Math.max(0, quiz.attemptsAllowed - used) : null;

    return cors(
      req,
      ok({
        quiz: quizCard(quiz),
        questionCount,
        attemptsUsed: used,
        attemptsLeft,
        canStart: questionCount > 0 && !open && (attemptsLeft === null || attemptsLeft > 0),
        openAttempt: open ? await openAttemptPayload(quiz, open) : null,
        lastAttempt: done.length ? attemptBrief(done[0]) : null,
        attempts: attempts.map(attemptBrief),
      }),
      "app",
      METHODS
    );
  } catch (e) {
    return cors(req, fail(e), "app", METHODS);
  }
}
