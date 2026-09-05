import { headers } from "next/headers";
import Script from "next/script";
import type { Lang } from "@/lib/site-data";
import { toSlug } from "@/lib/site-content";
import { IconLibrary } from "@/components/site/IconLibrary";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Ticker } from "@/components/site/Ticker";
import { SiteFooter } from "@/components/site/SiteFooter";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const h = await headers();
  const pathname = h.get("x-pathname") || "/";
  const lang: Lang = h.get("x-lang") === "en" ? "en" : "ar";

  // اشتقاق المعرّف الحالي من المسار لضبط aria-current وزر تبديل اللغة.
  const rest = lang === "en" ? pathname.replace(/^\/en\/?/, "") : pathname.replace(/^\//, "");
  const currentSlug = toSlug(rest || undefined);

  const skipLabel = lang === "ar" ? "انتقل إلى المحتوى" : "Skip to content";
  // بوابة الطالب كاملةً (الرئيسية وكل الصفحات الفرعية) وصفحة تسجيل الدخول
  // والتطبيق المضمّن بلا إطار الموقع العام.
  const inApp = h.get("x-app-shell") === "1";
  const isStudentDashboard =
    pathname === "/student" ||
    pathname.startsWith("/student/") ||
    pathname === "/en/student" ||
    pathname.startsWith("/en/student/");
  const isPortal = currentSlug === "student-login" || isStudentDashboard || inApp;

  return (
    <html lang={lang} dir={lang === "ar" ? "rtl" : "ltr"}>
      <head>
        <meta name="theme-color" content="#123159" />
        <link rel="icon" type="image/png" href="/assets/img/favicon.png" />
        <link rel="preload" as="font" type="font/woff2" href="/assets/fonts/plex-600.woff2" crossOrigin="" />
        <link rel="stylesheet" href="/assets/css/style.css" />
        <link rel="stylesheet" href="/assets/css/inner-pages.css" />
        {lang === "en" && <link rel="stylesheet" href="/assets/css/en.css" />}
      </head>
      <body data-page={isPortal ? "portal" : currentSlug === "index" ? "home" : "inner"}>
        <a className="skip-link" href="#main">
          {skipLabel}
        </a>
        <IconLibrary />
        {!isPortal && <SiteHeader lang={lang} currentSlug={currentSlug} pathname={pathname} />}
        {!isPortal && <Ticker lang={lang} />}
        {children}
        {!isPortal && <SiteFooter lang={lang} />}
        {!isPortal && (
          <button className="to-top" id="toTop" type="button" aria-label={lang === "ar" ? "العودة إلى الأعلى" : "Back to top"}>
            <svg aria-hidden="true">
              <use href="#i-up" />
            </svg>
          </button>
        )}
        <Script src="/assets/js/main.js" strategy="afterInteractive" />
        <Script src="/assets/js/inner-pages.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
