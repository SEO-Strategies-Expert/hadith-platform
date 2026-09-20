import { headers } from "next/headers";
import Script from "next/script";
import type { Lang } from "@/lib/site-data";
import { toSlug } from "@/lib/site-content";
import { IconLibrary } from "@/components/site/IconLibrary";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Ticker } from "@/components/site/Ticker";
import { SiteFooter } from "@/components/site/SiteFooter";
import { getSettingsMap } from "@/lib/site-data";

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
  const settings = await getSettingsMap();
  const headingFonts: Record<string, string> = { Thuluth: "'Thuluth','ThuluthAlt','NaskhQ',serif", ThuluthAlt: "'ThuluthAlt','NaskhQ',serif", NaskhQ: "'NaskhQ','ThuluthAlt',serif", Cairo: "Cairo,'PlexAr',sans-serif", Tajawal: "Tajawal,'PlexAr',sans-serif", Amiri: "Amiri,'NaskhQ',serif", Scheherazade: "'Scheherazade New','NaskhQ',serif", NotoKufi: "'Noto Kufi Arabic','PlexAr',sans-serif", ReemKufi: "'Reem Kufi','PlexAr',sans-serif", Changa: "Changa,'PlexAr',sans-serif", Mada: "Mada,'PlexAr',sans-serif" };
  const bodyFonts: Record<string, string> = { PlexAr: "'PlexAr','IBM Plex Sans Arabic','Segoe UI',system-ui,sans-serif", Cairo: "Cairo,'PlexAr',sans-serif", Tajawal: "Tajawal,'PlexAr',sans-serif", Almarai: "Almarai,'PlexAr',sans-serif", NotoSans: "'Noto Sans Arabic','PlexAr',sans-serif", NotoKufi: "'Noto Kufi Arabic','PlexAr',sans-serif", Changa: "Changa,'PlexAr',sans-serif", Mada: "Mada,'PlexAr',sans-serif", Readex: "'Readex Pro','PlexAr',sans-serif", IBM: "'IBM Plex Sans Arabic','PlexAr',sans-serif", Segoe: "'Segoe UI',system-ui,sans-serif", System: "system-ui,sans-serif" };
  const headingFont = headingFonts[settings.get("font.heading") || "Thuluth"] || headingFonts.Thuluth;
  const bodyFont = bodyFonts[settings.get("font.body") || "PlexAr"] || bodyFonts.PlexAr;

  return (
    <html lang={lang} dir={lang === "ar" ? "rtl" : "ltr"}>
      <head>
        <meta name="theme-color" content="#123159" />
        <link rel="icon" type="image/png" href="/assets/img/favicon.png" />
        <link rel="preload" as="font" type="font/woff2" href="/assets/fonts/plex-600.woff2" crossOrigin="" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Almarai:wght@400;700&family=Amiri:wght@400;700&family=Cairo:wght@400;600;700&family=Changa:wght@400;600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Mada:wght@400;600;700&family=Noto+Kufi+Arabic:wght@400;600;700&family=Noto+Sans+Arabic:wght@400;600;700&family=Readex+Pro:wght@400;600;700&family=Reem+Kufi:wght@400;600;700&family=Scheherazade+New:wght@400;700&family=Tajawal:wght@400;500;700&display=swap" />
        <link rel="stylesheet" href="/assets/css/style.css" />
        <link rel="stylesheet" href="/assets/css/inner-pages.css" />
        {lang === "en" && <link rel="stylesheet" href="/assets/css/en.css" />}
      </head>
      <body data-page={isPortal ? "portal" : currentSlug === "index" ? "home" : "inner"} style={{ "--font-heading": headingFont, "--font-body": bodyFont } as React.CSSProperties}>
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
