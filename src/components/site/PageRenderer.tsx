import { notFound } from "next/navigation";
import type { Lang } from "@/lib/site-data";
import { getDiwanThreads } from "@/lib/site-data";
import { getPageBySlug } from "@/lib/site-content";
import { injectDiwanThreads } from "@/lib/diwan-html";
import { applyHeroOverrides } from "@/lib/page-hero";
import { bindPageSections, type PageParams } from "@/lib/site-sections";
import { getCourseBySlugOrId } from "@/lib/course-slug";
import { currentUser } from "@/lib/guard";
import { StudentCourseRequestPage } from "@/components/site/StudentCourseRequestPage";

export async function PageRenderer({
  slug,
  lang,
  params,
}: {
  slug: string;
  lang: Lang;
  params?: PageParams;
}) {
  const viewer = await currentUser();
  const isStudent = viewer?.role === "STUDENT";
  if (slug === "admissions") {
    if (isStudent) {
      // ?course=<slug> الجديد و?courseId=<id> القديم — كلاهما يُحلّ إلى id النموذج.
      const raw = params?.course ?? params?.courseId;
      const resolved = raw ? await getCourseBySlugOrId(raw) : null;
      return <StudentCourseRequestPage lang={lang} selectedCourseId={resolved?.id ?? raw} />;
    }
  }
  const page = await getPageBySlug(slug);
  if (!page || page.status !== "PUBLISHED") notFound();

  let html = lang === "ar" ? page.bodyHtmlAr : page.bodyHtmlEn;
  const isPortal = page.template === "portal";

  // الرئيسية تتضمّن معاينة "ديوان العلماء" — تُستبدل حاويتها الفارغة بقائمة حيّة من قاعدة البيانات.
  if (slug === "index" && html) {
    const rows = await getDiwanThreads(lang);
    html = injectDiwanThreads(html, rows, lang);
  } else if (html) {
    // الصفحات الداخلية: طبّق تعديلات الهيرو (العنوان/التمهيد/الصورة) من لوحة التحكم.
    html = applyHeroOverrides(html, page, lang);
  }

  // ربط بقيّة الأقسام (أخبار، فعاليات، هيئة علمية، مراحل، إصدارات، مكتبة…)
  // بجداول قاعدة البيانات، وتطبيع الروابط النسبية.
  if (html) {
    html = await bindPageSections(html, slug, lang, params, { isStudent });
  }

  if (isPortal) {
    return <div dangerouslySetInnerHTML={{ __html: html ?? "" }} />;
  }

  // #main نفسها تُستبدل بمحتوى الصفحة المخزَّن (يتضمّن بالفعل عنوانه الخاص/h1).
  return <main id="main" dangerouslySetInnerHTML={{ __html: html ?? "" }} />;
}
