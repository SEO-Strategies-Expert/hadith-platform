import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const lang = new URL(request.url).searchParams.get("lang") === "en" ? "en" : "ar";

  const threads = await prisma.diwanThread.findMany({
    where: { visible: true },
    orderBy: [{ pinned: "desc" }, { order: "asc" }],
    include: { category: true },
  });

  const data = threads.map((t) => ({
    t: lang === "ar" ? t.titleAr : t.titleEn,
    a: lang === "ar" ? t.authorAr : t.authorEn,
    r: lang === "ar" ? t.rankAr : t.rankEn,
    c: t.category?.key ?? "",
    tag: t.category ? (lang === "ar" ? t.category.labelAr : t.category.labelEn) : "",
    n: t.count,
    pin: t.pinned,
    d: lang === "ar" ? t.timeAr : t.timeEn,
  }));

  return NextResponse.json(data, {
    headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" },
  });
}
