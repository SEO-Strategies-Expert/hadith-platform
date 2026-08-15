// خبرٌ واحد بمتنه. يقبل المعرّف أو الـslug — التطبيق قد يصله أيّهما من رابطٍ مشارَك.
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-auth";
import { ok, fail } from "../../_lib";
import { cors, preflight, requireId } from "../../_http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const METHODS = "GET, OPTIONS";

export async function OPTIONS(req: Request) {
  return preflight(req, "public", METHODS);
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const key = requireId((await ctx.params).id, "معرّف الخبر");

    const row = await prisma.newsItem.findFirst({
      where: { visible: true, OR: [{ id: key }, { slug: key }] },
      select: {
        id: true,
        slug: true,
        titleAr: true,
        titleEn: true,
        excerptAr: true,
        excerptEn: true,
        bodyAr: true,
        bodyEn: true,
        imageUrl: true,
        tagAr: true,
        tagEn: true,
        date: true,
        featured: true,
      },
    });
    // الخبر المخفيّ والخبر غير الموجود يردّان الشيء نفسه — لا نكشف وجود مسوّدة.
    if (!row) throw new ApiError(404, "الخبر غير موجود");

    return cors(req, ok(row), "public", METHODS);
  } catch (e) {
    return cors(req, fail(e), "public", METHODS);
  }
}
