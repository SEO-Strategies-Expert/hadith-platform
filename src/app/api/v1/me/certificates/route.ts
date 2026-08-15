/**
 * وثائق الطالب (شهادات وإجازات).
 *
 * الاستعلام من `lib/certificates.ts` (`getStudentCertificates`) وانتقاؤه صريح
 * أصلًا؛ ونضيف هنا `verifyUrl` جاهزًا للمشاركة بالرمز المنسَّق («ABCD-EFGH-JKMN»)
 * لأنّه ما يُملى في المجالس ويُكتب باليد.
 */
import { getStudentCertificates, formatVerifyCode, verifyPath } from "@/lib/certificates";
import { requireApiStudent } from "@/lib/api-auth";
import { ok, fail } from "../../_lib";
import { cors, preflight, paging, slicePage } from "../../_http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const METHODS = "GET, OPTIONS";

export async function OPTIONS(req: Request) {
  return preflight(req, "app", METHODS);
}

export async function GET(req: Request) {
  try {
    const id = await requireApiStudent(req);
    const rows = await getStudentCertificates(id.userId);
    const { items, nextCursor } = slicePage(rows, paging(req));

    return cors(
      req,
      ok({
        items: items.map((c) => ({
          ...c,
          verifyCodeFormatted: formatVerifyCode(c.verifyCode),
          verifyPathAr: verifyPath("ar", c.verifyCode),
          verifyPathEn: verifyPath("en", c.verifyCode),
        })),
        nextCursor,
      }),
      "app",
      METHODS
    );
  } catch (e) {
    return cors(req, fail(e), "app", METHODS);
  }
}
