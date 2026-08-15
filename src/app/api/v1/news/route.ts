// الأخبار — قائمة مرقَّمة. المتن (`bodyAr/En`) لا يخرج هنا بل في مسار الخبر.
import { prisma } from "@/lib/prisma";
import { ok, fail } from "../_lib";
import { cors, preflight, paging, cursorArgs, page, queryFlag } from "../_http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const METHODS = "GET, OPTIONS";

export async function OPTIONS(req: Request) {
  return preflight(req, "public", METHODS);
}

export async function GET(req: Request) {
  try {
    const { limit, cursor } = paging(req);
    const featured = queryFlag(req, "featured");

    const rows = await prisma.newsItem.findMany({
      where: { visible: true, ...(featured ? { featured: true } : {}) },
      // فاصل ثانٍ بالمعرّف: أخبارٌ بتاريخٍ واحد ترتيبها غير مستقرّ بدونه،
      // فتتكرّر أو تسقط صفوفٌ بين صفحةٍ وأخرى.
      orderBy: [{ date: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...cursorArgs(cursor),
      select: {
        id: true,
        slug: true,
        titleAr: true,
        titleEn: true,
        excerptAr: true,
        excerptEn: true,
        imageUrl: true,
        tagAr: true,
        tagEn: true,
        date: true,
        featured: true,
      },
    });

    return cors(req, ok(page(rows, limit)), "public", METHODS);
  } catch (e) {
    return cors(req, fail(e), "public", METHODS);
  }
}
