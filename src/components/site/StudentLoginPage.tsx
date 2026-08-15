import { notFound } from "next/navigation";
import * as cheerio from "cheerio";
import type { Lang } from "@/lib/site-data";
import { getPageBySlug } from "@/lib/site-content";
import { bindPageSections } from "@/lib/site-sections";
import { StudentLoginForm } from "@/components/site/StudentLoginForm";

const MARKER = "<!--STUDENT_LOGIN_FORM-->";

/**
 * صفحة بوابة الطلاب: يبقى نصّها محرَّرًا من اللوحة كبقيّة الصفحات، لكن
 * نموذج الدخول نفسه مكوّن React حقيقي يستدعي المصادقة بدل النموذج الصوري.
 */
export async function StudentLoginPage({ lang }: { lang: Lang }) {
  const page = await getPageBySlug("student-login");
  if (!page || page.status !== "PUBLISHED") notFound();

  let html = (lang === "ar" ? page.bodyHtmlAr : page.bodyHtmlEn) ?? "";
  html = await bindPageSections(html, "student-login", lang);

  const $ = cheerio.load(html, null, false);
  const form = $("form").first();
  if (form.length > 0) form.replaceWith(MARKER);

  const [before, after] = $.html().split(MARKER);

  return (
    <div>
      <div dangerouslySetInnerHTML={{ __html: before ?? "" }} />
      <StudentLoginForm lang={lang} />
      <div dangerouslySetInnerHTML={{ __html: after ?? "" }} />
    </div>
  );
}
