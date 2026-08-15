/**
 * تفاصيل مقرّر — **عامّة**، فبنيتها كاملة ومحتواها مقفل.
 *
 * القاعدة هنا: تُعرض الوحدات والدروس بعناوينها ليرى الزائر ما سيدرس، ولا يخرج
 * `videoUrl` ولا متن الدرس ولا مرفقاته إلّا لما علَّمه المحرّر `freePreview`.
 * الطالب المسجَّل لا يستعمل هذا المسار أصلًا بل `/api/v1/me/courses/[id]`؛
 * ولذلك لا نفحص هنا رمزًا ولا تسجيلًا — هذا المسار **لا يفتح المحتوى لأحد**.
 */
import { prisma } from "@/lib/prisma";
import { getCourseTree } from "@/lib/lms";
import { ApiError } from "@/lib/api-auth";
import { ok, fail } from "../../_lib";
import { cors, preflight, requireId } from "../../_http";
import { courseCard, moduleTree } from "../../_dto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const METHODS = "GET, OPTIONS";

export async function OPTIONS(req: Request) {
  return preflight(req, "public", METHODS);
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const id = requireId((await ctx.params).id, "معرّف المقرّر");

    // فحص النشر أوّلًا واستعلامًا مستقلًّا: `getCourseTree` لا يعرف شرط النشر،
    // ولا نريد أن نبني الشجرة كلّها ثمّ نكتشف أنّ المقرّر غير منشور.
    const gate = await prisma.course.findUnique({
      where: { id },
      select: { published: true, visible: true },
    });
    // `visible` وحده كالموقع — انظر التعليق في `courses/route.ts`.
    if (!gate || !gate.visible) throw new ApiError(404, "المقرّر غير موجود");

    const course = await getCourseTree(id);
    if (!course) throw new ApiError(404, "المقرّر غير موجود");

    const lessonCount = course.modules.reduce((n, m) => n + m.lessons.length, 0);
    const freeCount = course.modules.reduce(
      (n, m) => n + m.lessons.filter((l) => l.freePreview).length,
      0
    );

    return cors(
      req,
      ok({
        ...courseCard(course, lessonCount),
        freePreviewCount: freeCount,
        // المعاينة المجّانيّة وحدها تُفتح؛ ما عداها عنوانٌ و`locked: true`.
        modules: moduleTree(course.modules, (l) => l.freePreview),
      }),
      "public",
      METHODS
    );
  } catch (e) {
    return cors(req, fail(e), "public", METHODS);
  }
}
