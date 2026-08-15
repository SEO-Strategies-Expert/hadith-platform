import { loginWithPassword } from "@/lib/api-auth";
import { ok, fail, body } from "../../_lib";
import { cors, preflight } from "../../_http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const b = await body<{
      email?: string;
      password?: string;
      deviceId?: string;
      deviceName?: string;
    }>(req);

    if (!b.email || !b.password) {
      return cors(req, Response.json({ error: "البريد وكلمة المرور مطلوبان" }, { status: 400 }), "app", "POST, OPTIONS");
    }

    const pair = await loginWithPassword(b.email, b.password, b.deviceId, b.deviceName);
    // رسالة واحدة لكل حالات الفشل — لا تكشف أيّ البريدين مسجَّل.
    if (!pair) {
      return cors(req, Response.json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" }, { status: 401 }), "app", "POST, OPTIONS");
    }
    return cors(req, ok(pair), "app", "POST, OPTIONS");
  } catch (e) {
    return cors(req, fail(e), "app", "POST, OPTIONS");
  }
}

export function OPTIONS(req: Request) {
  return preflight(req, "app", "POST, OPTIONS");
}
