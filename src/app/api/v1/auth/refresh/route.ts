import { refreshTokens } from "@/lib/api-auth";
import { ok, fail, body } from "../../_lib";
import { cors, preflight } from "../../_http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { refreshToken } = await body<{ refreshToken?: string }>(req);
    if (!refreshToken) {
      return cors(req, Response.json({ error: "رمز التجديد مطلوب" }, { status: 400 }), "app", "POST, OPTIONS");
    }
    const pair = await refreshTokens(refreshToken);
    // 401 تعني للتطبيق: امسح الرموز وأعِد المستخدم إلى شاشة الدخول.
    if (!pair) {
      return cors(req, Response.json({ error: "رمز التجديد غير صالح" }, { status: 401 }), "app", "POST, OPTIONS");
    }
    return cors(req, ok(pair), "app", "POST, OPTIONS");
  } catch (e) {
    return cors(req, fail(e), "app", "POST, OPTIONS");
  }
}

export function OPTIONS(req: Request) {
  return preflight(req, "app", "POST, OPTIONS");
}
