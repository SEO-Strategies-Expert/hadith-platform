import type { Lang } from "@/lib/site-data";

// يحوّل href مخزَّن (مثل "about.html" أو "index.html" أو "faculty.html#scientific-council")
// إلى رابط فعلي حسب اللغة، مع معاملة خاصّة للصفحة الرئيسية.
export function siteHref(lang: Lang, href: string): string {
  const [path, hash] = href.split("#");
  const isHome = path === "index.html" || path === "";
  const base = isHome
    ? lang === "ar"
      ? "/"
      : "/en"
    : lang === "ar"
      ? `/${path}`
      : `/en/${path}`;
  return hash ? `${base}#${hash}` : base;
}

// المسار المقابل لنفس الصفحة باللغة الأخرى — لزر تبديل اللغة.
export function counterpartHref(lang: Lang, currentSlug: string): string {
  const target = lang === "ar" ? "en" : "ar";
  const isHome = currentSlug === "index" || currentSlug === "";
  if (target === "en") return isHome ? "/en" : `/en/${currentSlug}.html`;
  return isHome ? "/" : `/${currentSlug}.html`;
}
