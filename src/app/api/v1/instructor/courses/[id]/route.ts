/**
 * تفاصيل مقرّرٍ للمحاضر وطلابه — `GET /api/v1/instructor/courses/[id]`.
 *
 * **العزل:** المعرّف يأتي من الرابط، فلا يُوثق به وحده أبدًا.
 * `getInstructorCourse` تستعمل `findFirst({ where: { id, instructorId } })`
 * — شرطان مجتمعان في الاستعلام الواحد، لا جلبٌ ثمّ مقارنة. وكذلك
 * `getCourseStudents` تحمل شرط `course.instructorId` داخل `where`.
 *
 * والفشل ٤٠٤ لا ٤٠٣: «ممنوع» تؤكّد لمن يجرّب المعرّفات أنّ المقرّر موجود،
 * فيصير الردّ نفسه قناةَ استكشاف. ولهذا يُعامَل «غير موجود» و«ليس لك»
 * معاملةً واحدة — ومعهما الحساب غير المربوط بملفّ هيئة: بلا `scholarId`
 * لا ملكيّة أصلًا.
 */
import { getInstructorCourse, getCourseStudents } from "@/lib/instructor";
import { ApiError } from "@/lib/api-auth";
import { ok, fail } from "../../../_lib";
import { cors, preflight, requireId } from "../../../_http";
import { requireApiInstructor } from "../../_guard";
import { instructorCourseDetail, courseStudent } from "../../_dto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const METHODS = "GET, OPTIONS";
const NOT_FOUND = "المقرّر غير موجود أو ليس مسنَدًا إليك";

export async function OPTIONS(req: Request) {
  return preflight(req, "app", METHODS);
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const me = await requireApiInstructor(req);
    const courseId = requireId((await ctx.params).id, "معرّف المقرّر");

    if (!me.scholarId) throw new ApiError(404, NOT_FOUND);

    const [course, students] = await Promise.all([
      getInstructorCourse(me.scholarId, courseId),
      getCourseStudents(me.scholarId, courseId),
    ]);
    if (!course) throw new ApiError(404, NOT_FOUND);

    const lessonCount = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);

    return cors(
      req,
      ok({
        ...instructorCourseDetail(course),
        counts: {
          modules: course.modules.length,
          lessons: lessonCount,
          students: students.length,
        },
        students: students.map(courseStudent),
      }),
      "app",
      METHODS
    );
  } catch (e) {
    return cors(req, fail(e), "app", METHODS);
  }
}
