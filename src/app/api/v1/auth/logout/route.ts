import { revokeRefreshToken } from "@/lib/api-auth";
import { ok, fail, body } from "../../_lib";
import { cors, preflight } from "../../_http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { refreshToken } = await body<{ refreshToken?: string }>(req);
    if (refreshToken) await revokeRefreshToken(refreshToken);
    // ننجح دائمًا: الخروج يجب ألّا يفشل في وجه المستخدم.
    return cors(req, ok({ ok: true }), "app", "POST, OPTIONS");
  } catch (e) {
    return cors(req, fail(e), "app", "POST, OPTIONS");
  }
}

export function OPTIONS(req: Request) {
  return preflight(req, "app", "POST, OPTIONS");
}
