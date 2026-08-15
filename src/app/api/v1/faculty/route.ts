/**
 * أعضاء الهيئة العلميّة الظاهرون.
 *
 * لاحِظ ما ليس في الانتقاء: علاقة `accounts` (حسابات المستخدمين المربوطة
 * بالعالِم). جرُّها يخرج بريدًا ودورًا وحالةَ حساب في مسارٍ علنيّ.
 */
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
    // الهيئة قائمة صغيرة مستقرّة، فحدّها الافتراضي أوسع — ومع ذلك مقيَّد بسقف.
    const { limit, cursor } = paging(req, 50);
    const councilOnly = queryFlag(req, "council");

    const rows = await prisma.scholar.findMany({
      where: { visible: true, ...(councilOnly ? { isCouncil: true } : {}) },
      orderBy: [{ order: "asc" }, { id: "asc" }],
      take: limit + 1,
      ...cursorArgs(cursor),
      select: {
        id: true,
        nameAr: true,
        nameEn: true,
        rankAr: true,
        rankEn: true,
        specAr: true,
        specEn: true,
        bioAr: true,
        bioEn: true,
        photoUrl: true,
        countryAr: true,
        countryEn: true,
        isCouncil: true,
        isCouncilHead: true,
        order: true,
      },
    });

    return cors(req, ok(page(rows, limit)), "public", METHODS);
  } catch (e) {
    return cors(req, fail(e), "public", METHODS);
  }
}
