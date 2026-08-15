/**
 * تفاصيل مجلسٍ وحضوره — `GET /api/v1/instructor/sessions/[id]`.
 *
 * ⚠️ **المسار الثاني والأخير الذي يخرج منه `zoomStartUrl`.**
 * `getInstructorSession` تستعمل `findFirst({ where: { id, instructorId } })`
 * — شرطان مجتمعان. وهذا بالضبط ما يمنع محاضرًا من فتح مجلس زميله بتخمين
 * المعرّف ومعه رابط مضيفه. لو كان الفحص بعد الجلب لكان الصفّ (وفيه الرابط)
 * قد خرج من القاعدة قبل أن يُقال «ممنوع».
 *
 * والفشل ٤٠٤ لا ٤٠٣ — لئلّا يصير الردّ نفسه دليلًا على وجود المجلس.
 */
import { getInstructorSession } from "@/lib/instructor";
import { ApiError } from "@/lib/api-auth";
import { ok, fail } from "../../../_lib";
import { cors, preflight, requireId } from "../../../_http";
import { requireApiInstructor } from "../../_guard";
import { instructorSessionDetail } from "../../_dto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const METHODS = "GET, OPTIONS";
const NOT_FOUND = "المجلس غير موجود أو ليس مسنَدًا إليك";

export async function OPTIONS(req: Request) {
  return preflight(req, "app", METHODS);
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const me = await requireApiInstructor(req);
    const sessionId = requireId((await ctx.params).id, "معرّف المجلس");

    if (!me.scholarId) throw new ApiError(404, NOT_FOUND);

    const session = await getInstructorSession(me.scholarId, sessionId);
    if (!session) throw new ApiError(404, NOT_FOUND);

    return cors(req, ok(instructorSessionDetail(session)), "app", METHODS);
  } catch (e) {
    return cors(req, fail(e), "app", METHODS);
  }
}
