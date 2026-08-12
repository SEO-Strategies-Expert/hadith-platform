"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";

const TEXT = [
  "titleAr", "titleEn", "metaDescAr", "metaDescEn",
  "heroKickerAr", "heroKickerEn", "heroTitleAr", "heroTitleEn",
  "heroIntroAr", "heroIntroEn", "heroImage",
  "bodyHtmlAr", "bodyHtmlEn",
  "seoTitleAr", "seoTitleEn", "seoDescAr", "seoDescEn", "ogImage",
] as const;

export async function updatePage(
  slug: string,
  _prev: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  await requireUser();
  if (!formData.get("titleAr") || !formData.get("titleEn"))
    return "العنوان بالعربية والإنجليزية مطلوب.";

  const data: Record<string, unknown> = {};
  for (const key of TEXT) {
    const v = formData.get(key);
    data[key] = v == null || String(v).trim() === "" ? null : String(v);
  }
  data.status = formData.get("status") === "DRAFT" ? "DRAFT" : "PUBLISHED";

  await prisma.page.update({ where: { slug }, data });
  revalidatePath("/admin/pages");
  redirect("/admin/pages?saved=1");
}
