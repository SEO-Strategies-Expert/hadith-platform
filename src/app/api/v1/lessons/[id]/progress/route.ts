/**
 * تعليم الدرس منجَزًا أو رفع العلامة عنه.
 *
 * الكتابة كلّها في `setLessonDone` (`lib/lms.ts`): تحفظ التقدّم **وتعيد حساب
 * نسبة المقرّر** في المعاملة نفسها. لا نكتب `progressPct` من هنا بحال —
 * نسبةٌ يرسلها العميل ليست نسبةً بل ادّعاء.
 *
 * والمعاينة المجّانيّة لا تُسجَّل تقدّمًا: التقدّم خاصّيّة تسجيلٍ لا مشاهدة.
 */
import { prisma } from "@/lib/prisma";
import { requireApiStudent, ApiError } from "@/lib/api-auth";
import { isEnrolled, setLessonDone } from "@/lib/lms";
import { ok, fail, body } from "../../../_lib";
import { cors, preflight, requireId } from "../../../_http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const METHODS = "POST, OPTIONS";

export async function OPTIONS(req: Request) {
  return preflight(req, "app", METHODS);
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const id = await requireApiStudent(req);
    const lessonId = requireId((await ctx.params).id, "معرّف الدرس");

    const b = await body<{ done?: unknown }>(req);
    if (typeof b.done !== "boolean") throw new ApiError(400, "الحقل done مطلوب ويجب أن يكون true أو false");

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, visible: true, module: { select: { visible: true, courseId: true } } },
    });
    if (!lesson || !lesson.visible || !lesson.module.visible) throw new ApiError(404, "الدرس غير موجود");

    if (!(await isEnrolled(id.userId, lesson.module.courseId))) {
      throw new ApiError(403, "هذا الدرس للمسجَّلين في المقرّر");
    }

    const courseId = await setLessonDone(id.userId, lessonId, b.done);

    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: id.userId, courseId } },
      select: { progressPct: true, status: true },
    });

    return cors(
      req,
      ok({
        lessonId,
        done: b.done,
        courseId,
        progressPct: enrollment?.progressPct ?? 0,
        enrollmentStatus: enrollment?.status ?? null,
      }),
      "app",
      METHODS
    );
  } catch (e) {
    return cors(req, fail(e), "app", METHODS);
  }
}
