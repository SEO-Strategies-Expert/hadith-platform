/**
 * المجالس العامّة القادمة — لتقويم التطبيق بلا تسجيل دخول.
 *
 * الاستعلام من `lib/lms.ts` (`getPublicSessions`) وهو يُرجع سجلّ `LiveSession`
 * كاملًا، وفيه `zoomStartUrl` (رابط المضيف) و`recordingPasscode`. ولذلك
 * **لا يُعاد ما تُرجعه الدالّة كما هو أبدًا**، بل يمرّ على `sessionPublic`
 * التي تنتقي حقولها واحدًا واحدًا.
 */
import { getPublicSessions } from "@/lib/lms";
import { ok, fail } from "../../_lib";
import { cors, preflight, paging } from "../../_http";
import { sessionPublic } from "../../_dto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const METHODS = "GET, OPTIONS";

export async function OPTIONS(req: Request) {
  return preflight(req, "public", METHODS);
}

export async function GET(req: Request) {
  try {
    // نافذةٌ زمنيّة لا صفحات: القائمة محدودة بطبيعتها (القادم فقط)، والمؤشّر
    // على مجموعةٍ تتغيّر بمرور الوقت يربك أكثر ممّا يفيد.
    const { limit } = paging(req);
    const rows = await getPublicSessions(limit);
    return cors(req, ok({ items: rows.map(sessionPublic), nextCursor: null }), "public", METHODS);
  } catch (e) {
    return cors(req, fail(e), "public", METHODS);
  }
}
