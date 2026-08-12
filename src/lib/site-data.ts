import { prisma } from "@/lib/prisma";

export type Lang = "ar" | "en";

export async function getHeaderNav() {
  return prisma.navLink.findMany({
    where: { menu: "HEADER", parentId: null, visible: true },
    orderBy: { order: "asc" },
    include: { children: { orderBy: { order: "asc" }, where: { visible: true } } },
  });
}

export async function getFooterNav() {
  const rows = await prisma.navLink.findMany({
    where: { menu: "FOOTER", visible: true },
    orderBy: { order: "asc" },
  });
  const groups = new Map<string, typeof rows>();
  for (const r of rows) {
    const g = groups.get(r.group ?? "col1") ?? [];
    g.push(r);
    groups.set(r.group ?? "col1", g);
  }
  return groups;
}

export async function getSocialLinks() {
  return prisma.socialLink.findMany({
    where: { visible: true },
    orderBy: { order: "asc" },
  });
}

export async function getSettingsMap() {
  const rows = await prisma.setting.findMany();
  const map = new Map<string, string>();
  for (const r of rows) map.set(r.key, r.value == null ? "" : String(r.value));
  return map;
}

export async function getTickerItems(lang: Lang) {
  const items = await prisma.newsItem.findMany({
    where: { visible: true },
    orderBy: { date: "desc" },
    take: 6,
  });
  return items.map((n) => ({
    href: `news.html`,
    label: lang === "ar" ? n.titleAr : n.titleEn,
  }));
}

export type DiwanRow = {
  t: string;
  a: string;
  r: string | null;
  c: string;
  tag: string;
  n: number;
  pin: boolean;
  d: string | null;
};

export async function getDiwanThreads(lang: Lang): Promise<DiwanRow[]> {
  const threads = await prisma.diwanThread.findMany({
    where: { visible: true },
    orderBy: [{ pinned: "desc" }, { order: "asc" }],
    include: { category: true },
  });
  return threads.map((t) => ({
    t: lang === "ar" ? t.titleAr : t.titleEn,
    a: lang === "ar" ? t.authorAr : t.authorEn,
    r: lang === "ar" ? t.rankAr : t.rankEn,
    c: t.category?.key ?? "",
    tag: t.category ? (lang === "ar" ? t.category.labelAr : t.category.labelEn) : "",
    n: t.count,
    pin: t.pinned,
    d: lang === "ar" ? t.timeAr : t.timeEn,
  }));
}

export async function getHeroSlides() {
  return prisma.heroSlide.findMany({
    where: { visible: true },
    orderBy: { order: "asc" },
  });
}
