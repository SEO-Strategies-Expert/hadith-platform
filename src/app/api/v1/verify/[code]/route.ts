/**
 * التحقّق العلنيّ من وثيقة (شهادة أو إجازة) برمزها المشارَك.
 *
 * كل المنطق في `lib/certificates.ts`: يوحّد الرمز المكتوب يدويًّا، ويردّ
 * `PublicCertificate` **منتقاةً صراحةً** — اسم صاحبها وبيانات الوثيقة فقط،
 * بلا `userId` ولا بريد ولا هاتف ولا رقم جامعيّ ولا `revokeNote`.
 *
 * الرمز المشوَّه والرمز غير الموجود يردّان `unknown` نفسها، وبحالة ٢٠٠ لا ٤٠٤:
 * «لا وثيقة بهذا الرمز» جوابٌ صحيح لسؤالٍ صحيح، لا خطأٌ في الطلب.
 */
import { verifyCertificate } from "@/lib/certificates";
import { ok, fail } from "../../_lib";
import { cors, preflight, requireId } from "../../_http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const METHODS = "GET, OPTIONS";

export async function OPTIONS(req: Request) {
  return preflight(req, "public", METHODS);
}

export async function GET(req: Request, ctx: { params: Promise<{ code: string }> }) {
  try {
    // بلا `decodeURIComponent`: Next يفكّ ترميز معاملات المسار أصلًا، وفكُّه
    // مرّةً ثانية يرمي `URIError` على `%` مفردة فيصير خطأ إدخالٍ خطأَ خادم.
    // و`normalizeVerifyCode` تُسقط ما ليس من أبجديّة الرمز على كل حال.
    const code = requireId((await ctx.params).code, "رمز التحقّق");
    const result = await verifyCertificate(code);

    return cors(
      req,
      ok(
        result.status === "unknown"
          ? { status: "unknown", certificate: null }
          : { status: result.status, certificate: result.certificate }
      ),
      "public",
      METHODS
    );
  } catch (e) {
    return cors(req, fail(e), "public", METHODS);
  }
}
