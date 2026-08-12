import { cache } from "react";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import type { Lang } from "@/lib/site-data";

// cache() يمنع الاستعلام المزدوج بين generateMetadata والصفحة نفسها لنفس الطلب.
export const getPageBySlug = cache(async (slug: string) => {
  return prisma.page.findUnique({ where: { slug } });
});

// يحوّل معرّف مسار مثل "about.html" أو "about" إلى slug مخزَّن بلا امتداد.
export function toSlug(segment: string | undefined): string {
  if (!segment) return "index";
  return segment.replace(/\.html$/i, "");
}

export async function buildMetadata(slug: string, lang: Lang): Promise<Metadata> {
  const page = await getPageBySlug(slug);
  if (!page) return {};

  const title = lang === "ar" ? page.seoTitleAr || page.titleAr : page.seoTitleEn || page.titleEn;
  const description = lang === "ar" ? page.seoDescAr || page.metaDescAr : page.seoDescEn || page.metaDescEn;

  return {
    title: title || undefined,
    description: description || undefined,
    openGraph: page.ogImage ? { images: [page.ogImage] } : undefined,
  };
}
