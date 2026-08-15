/**
 * مجالس الطالب القادمة (مقرّراته ومرحلته والمجالس العامّة) مع حالة البثّ.
 *
 * `getUpcomingSessions` من `lib/lms.ts` تُرجع سجلّ `LiveSession` كاملًا وفيه
 * **`zoomStartUrl`** — رابط المضيف الذي يفتتح المجلس باسم المحاضر. لا يُعاد
 * الصفّ كما هو أبدًا: `sessionForStudent` تنتقي الحقول واحدًا واحدًا،
 * و`zoomStartUrl` غير مذكور فيها أصلًا.
 */
import { getUpcomingSessions } from "@/lib/lms";
import { requireApiStudent } from "@/lib/api-auth";
import { ok, fail } from "../../_lib";
import { cors, preflight, paging } from "../../_http";
import { sessionForStudent } from "../../_dto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const METHODS = "GET, OPTIONS";

export async function OPTIONS(req: Request) {
  return preflight(req, "app", METHODS);
}

export async function GET(req: Request) {
  try {
    const id = await requireApiStudent(req);
    // نافذةٌ زمنيّة مقيَّدة بالحدّ الأقصى، بلا مؤشّر: «القادم» مجموعةٌ متحرّكة.
    const { limit } = paging(req);
    const rows = await getUpcomingSessions(id.userId, limit);

    return cors(
      req,
      ok({ items: rows.map(sessionForStudent), nextCursor: null }),
      "app",
      METHODS
    );
  } catch (e) {
    return cors(req, fail(e), "app", METHODS);
  }
}
