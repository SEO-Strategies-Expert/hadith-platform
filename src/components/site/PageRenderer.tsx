import { notFound } from "next/navigation";
import type { Lang } from "@/lib/site-data";
import { getPageBySlug } from "@/lib/site-content";

export async function PageRenderer({ slug, lang }: { slug: string; lang: Lang }) {
  const page = await getPageBySlug(slug);
  if (!page || page.status !== "PUBLISHED") notFound();

  const html = lang === "ar" ? page.bodyHtmlAr : page.bodyHtmlEn;
  const isPortal = page.template === "portal";

  if (isPortal) {
    return <div dangerouslySetInnerHTML={{ __html: html ?? "" }} />;
  }

  // #main نفسها تُستبدل بمحتوى الصفحة المخزَّن (يتضمّن بالفعل عنوانه الخاص/h1).
  return <main id="main" dangerouslySetInnerHTML={{ __html: html ?? "" }} />;
}
