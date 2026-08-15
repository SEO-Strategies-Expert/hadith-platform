/**
 * طلاب مقرّرات المحاضر — `GET /api/v1/instructor/students`.
 *
 * الصفّ هنا **تسجيل** لا طالب: الطالب الواحد قد يظهر مرّتين إن سجّل في
 * مقرّرين للمحاضر نفسه، وكل صفٍّ يحمل مقرّره ونسبة تقدّمه فيه. أمّا عدد
 * الطلاب المتمايزين فيُحسب في `/summary` بـ`distinct`.
 *
 * العزل بشرط `course.instructorId = scholarId` داخل `where`: الطالب نفسه
 * قد يكون مسجَّلًا عند محاضرٍ آخر، ولا يظهر من ذلك شيءٌ هنا.
 */
import { getInstructorStudents } from "@/lib/instructor";
import { ok, fail } from "../../_lib";
import { cors, preflight, paging, slicePage } from "../../_http";
import { requireApiInstructor, unlinkedBody } from "../_guard";
import { instructorStudent } from "../_dto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const METHODS = "GET, OPTIONS";

export async function OPTIONS(req: Request) {
  return preflight(req, "app", METHODS);
}

export async function GET(req: Request) {
  try {
    const me = await requireApiInstructor(req);

    if (!me.scholarId) {
      return cors(req, ok(unlinkedBody({ items: [], nextCursor: null, total: 0 })), "app", METHODS);
    }

    const all = await getInstructorStudents(me.scholarId);
    const { items, nextCursor } = slicePage(all, paging(req));

    return cors(
      req,
      ok({
        scholarLinked: true,
        items: items.map(instructorStudent),
        nextCursor,
        total: all.length,
      }),
      "app",
      METHODS
    );
  } catch (e) {
    return cors(req, fail(e), "app", METHODS);
  }
}
