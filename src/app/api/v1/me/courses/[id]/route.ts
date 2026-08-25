/**
 * شجرة المقرّر كاملةً **بمحتوى الدروس** — للطالب المسجَّل وحده.
 *
 * الحارس الوحيد هنا هو `isEnrolled`: لا يكفي أن يحمل الطالب رمزًا صحيحًا،
 * ولا أن يكون المقرّر منشورًا. ولذلك يُفحص التسجيل **قبل** بناء الشجرة، لا بعده.
 */
import { getCourseTree, isEnrolled, flattenLessons, getProgressMap } from "@/lib/lms";
import { requireApiUser, ApiError } from "@/lib/api-auth";
import { ok, fail } from "../../../_lib";
import { cors, preflight, requireId } from "../../../_http";
import { courseCard, moduleTree } from "../../../_dto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const METHODS = "GET, OPTIONS";

export async function OPTIONS(req: Request) {
  return preflight(req, "app", METHODS);
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const id = await requireApiUser(req);
    const courseId = requireId((await ctx.params).id, "معرّف المقرّر");

    if (!(await isEnrolled(id.userId, courseId))) {
      // ٤٠٤ لا ٤٠٣: «ممنوع» تؤكّد لمن يجرّب المعرّفات أنّ المقرّر موجود.
      throw new ApiError(404, "المقرّر غير موجود أو لست مسجَّلًا فيه");
    }

    const course = await getCourseTree(courseId);
    if (!course) throw new ApiError(404, "المقرّر غير موجود");

    const lessons = flattenLessons(course);
    const progress = await getProgressMap(
      id.userId,
      lessons.map((l) => l.id)
    );

    const doneCount = lessons.filter((l) => progress.get(l.id)).length;

    return cors(
      req,
      ok({
        ...courseCard(course, lessons.length),
        // مسجَّلٌ ⇒ كل درسٍ مفتوح؛ الشرط ثابتٌ `true` لا لكونه مهمَلًا بل لأنّ
        // القرار اتُّخذ فوق عند `isEnrolled`، ولا يُعاد اتّخاذه لكل درس.
        modules: moduleTree(course.modules, () => true, progress),
        progress: {
          total: lessons.length,
          done: doneCount,
          pct: lessons.length ? Math.round((doneCount / lessons.length) * 100) : 0,
        },
      }),
      "app",
      METHODS
    );
  } catch (e) {
    return cors(req, fail(e), "app", METHODS);
  }
}
