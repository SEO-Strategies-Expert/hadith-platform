import { notFound } from "next/navigation";
import type { Lang } from "@/lib/site-data";
import { getDiwanThreads } from "@/lib/site-data";
import { getPageBySlug } from "@/lib/site-content";
import { injectDiwanThreads } from "@/lib/diwan-html";

export async function PageRenderer({ slug, lang }: { slug: string; lang: Lang }) {
  const page = await getPageBySlug(slug);
  if (!page || page.status !== "PUBLISHED") notFound();

  let html = lang === "ar" ? page.bodyHtmlAr : page.bodyHtmlEn;
  const isPortal = page.template === "portal";

  // الرئيسية تتضمّن معاينة "ديوان العلماء" — تُستبدل حاويتها الفارغة بقائمة حيّة من قاعدة البيانات.
  if (slug === "index" && html) {
    const rows = await getDiwanThreads(lang);
    html = injectDiwanThreads(html, rows, lang);
  }

  if (isPortal) {
    return <div dangerouslySetInnerHTML={{ __html: html ?? "" }} />;
  }

  // #main نفسها تُستبدل بمحتوى الصفحة المخزَّن (يتضمّن بالفعل عنوانه الخاص/h1).
  return <main id="main" dangerouslySetInnerHTML={{ __html: html ?? "" }} />;
}
