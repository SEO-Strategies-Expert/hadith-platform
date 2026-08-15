/**
 * مجالس المحاضر مقسومةً قادمة/منتهية — `GET /api/v1/instructor/sessions`.
 *
 * ⚠️ **هذا أحد مسارين اثنين يخرج منهما `zoomStartUrl`** (والآخر
 * `/sessions/[id]`). الاستعلام مصفّى بـ`instructorId = scholarId` داخل
 * `where`، فكل صفٍّ يصل إلى الإسقاط هو مجلسٌ لصاحب الطلب — ورابط المضيف
 * إذًا رابطه هو. لا يظهر هذا الحقل في `/courses` ولا `/students` ولا
 * `/summary`، ولا في أيّ مسارٍ من مسارات الطالب البتّة.
 *
 * القسمة والحدّ الزمنيّ («يبقى قادمًا ساعةً بعد بدايته») في
 * `getInstructorSessions` — الساعة تُقرأ هناك مرّةً واحدة.
 *
 * `?limit=` يقصّ **المنتهية** وحدها: القادمة قائمةُ عملٍ يحتاجها المحاضر
 * كاملةً، والمنتهية أرشيفٌ ينمو بلا حدّ.
 */
import { getInstructorSessions } from "@/lib/instructor";
import { ok, fail } from "../../_lib";
import { cors, preflight, paging } from "../../_http";
import { requireApiInstructor, unlinkedBody } from "../_guard";
import { instructorSession } from "../_dto";

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
      return cors(req, ok(unlinkedBody({ upcoming: [], past: [] })), "app", METHODS);
    }

    const { limit } = paging(req);
    const { upcoming, past } = await getInstructorSessions(me.scholarId);

    return cors(
      req,
      ok({
        scholarLinked: true,
        upcoming: upcoming.map(instructorSession),
        past: past.slice(0, limit).map(instructorSession),
      }),
      "app",
      METHODS
    );
  } catch (e) {
    return cors(req, fail(e), "app", METHODS);
  }
}
