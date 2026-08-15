import type { Lang } from "@/lib/site-data";

// يحوّل href مخزَّن (مثل "about.html" أو "index.html" أو "faculty.html#scientific-council")
// إلى رابط فعلي حسب اللغة، مع معاملة خاصّة للصفحة الرئيسية.
export function siteHref(lang: Lang, href: string): string {
  // روابط خارجية كاملة (مواقع بحثية خارجية…) تُترك كما هي بلا تحويل.
  if (/^([a-z]+:)?\/\//i.test(href) || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return href;
  }
  // رابطٌ نائبٌ بلا وجهة بعد ("#" فقط) — يُترك كما هو بدل تحويله للرئيسية.
  if (href.startsWith("#")) {
    return href;
  }
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

/**
 * المسار المقابل لنفس الصفحة باللغة الأخرى — لزر تبديل اللغة.
 *
 * يُشتقّ من **المسار الفعلي** لا من المعرّف: النسخة القديمة كانت تُلحق `.html`
 * دائمًا، وهو صحيح لصفحات الموقع المُرحَّلة (`about.html`) لكنّه يكسر مسارات
 * بوابة الطالب النظيفة — `/student/lesson/<id>` كان يصير
 * `/en/student/lesson/<id>.html` وهو مسار غير موجود.
 * تبديل البادئة يعالج الشكلين معًا بلا استثناءات مكتوبة بأسماء المسارات.
 */
export function counterpartPath(lang: Lang, pathname: string): string {
  if (lang === "en") {
    const rest = pathname.replace(/^\/en(?=\/|$)/, "");
    return rest === "" || rest === "/" ? "/" : rest;
  }
  return pathname === "/" ? "/en" : `/en${pathname}`;
}
