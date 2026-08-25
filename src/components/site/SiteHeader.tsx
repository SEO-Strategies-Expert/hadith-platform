import Link from "next/link";
import type { Lang } from "@/lib/site-data";
import { getHeaderNav, getSocialLinks, getSettingsMap } from "@/lib/site-data";
import { siteHref, counterpartPath } from "@/lib/site-links";

const T = {
  ar: {
    platforms: "منصّات الكلّية",
    quickLinks: "روابط سريعة",
    switchTo: "English",
    search: "بحث",
    searchAria: "بحث في الموقع",
    searchPlaceholder: "ابحث في الكلّية — البرامج، الأبحاث، المجالس…",
    mainNav: "التنقّل الرئيسي",
    login: "دخول الطالب",
    menu: "القائمة",
    home: "الرئيسية",
    live: "البث المباشر",
    uniSocial: "صفحات الجامعة",
    accreditation: "الإعتماد",
  },
  en: {
    platforms: "College platforms",
    quickLinks: "Quick links",
    switchTo: "العربية",
    search: "Search",
    searchAria: "Search the site",
    searchPlaceholder: "Search the college — programs, research, councils…",
    mainNav: "Main navigation",
    login: "Student Login",
    menu: "Menu",
    home: "Home",
    live: "Live broadcast",
    uniSocial: "University social pages",
    accreditation: "Accreditation",
  },
} as const;

export async function SiteHeader({
  lang,
  currentSlug,
  pathname,
}: {
  lang: Lang;
  currentSlug: string;
  pathname: string;
}) {
  const [nav, social, settings] = await Promise.all([
    getHeaderNav(),
    getSocialLinks(),
    getSettingsMap(),
  ]);
  const t = T[lang];
  const brandName = lang === "ar" ? settings.get("site.shortAr") : settings.get("site.shortEn");
  // السقوط إلى الاسم المختصر ثم إلى نصّ ثابت: الاسم يدخل في قالب نصّي لـaria-label،
  // وقيمة غائبة كانت تُطبع حرفيًّا «undefined» فيقرأها قارئ الشاشة.
  const brandFull =
    (lang === "ar" ? settings.get("site.nameAr") : settings.get("site.nameEn")) ||
    brandName ||
    (lang === "ar" ? "الكلّية العليا للحديث النبوي" : "The Higher College of Prophetic Hadith");
  const liveUrl = settings.get("header.liveUrl") || "#";
  const uniSocialUrl = settings.get("header.universitySocialUrl") || "#";

  return (
    <header className="site-head">
      <div className="navbar">
        <div className="container">
          <ul className="platforms" aria-label={t.platforms}>
            {social.map((s) => (
              <li key={s.id}>
                <a
                  className={s.key}
                  href={s.url || "#"}
                  aria-label={lang === "ar" ? s.labelAr : s.labelEn}
                  title={lang === "ar" ? s.labelAr : s.labelEn}
                  target={s.url && s.url !== "#" ? "_blank" : undefined}
                  rel={s.url && s.url !== "#" ? "noopener noreferrer" : undefined}
                >
                  <svg className="brandicon" aria-hidden="true">
                    <use href={`#${s.icon}`} />
                  </svg>
                </a>
              </li>
            ))}
          </ul>

          <nav className="navbar-links" aria-label={t.quickLinks}>
            <Link
              className="lang-switch"
              href={counterpartPath(lang, pathname)}
              hrefLang={lang === "ar" ? "en" : "ar"}
              lang={lang === "ar" ? "en" : "ar"}
            >
              <svg aria-hidden="true">
                <use href="#i-globe" />
              </svg>{" "}
              {t.switchTo}
            </Link>
          </nav>

          <div className="navbar-icons">
            <a
              className="navbar-iconbtn navbar-live"
              href={liveUrl}
              target={liveUrl !== "#" ? "_blank" : undefined}
              rel={liveUrl !== "#" ? "noopener noreferrer" : undefined}
              aria-label={t.live}
              title={t.live}
            >
              <span className="navbar-live-label">{t.live}</span>
              <svg aria-hidden="true">
                <use href="#i-live" />
              </svg>
              <span className="navbar-live-dot" aria-hidden="true" />
            </a>
            <a
              className="navbar-iconbtn"
              href={uniSocialUrl}
              target={uniSocialUrl !== "#" ? "_blank" : undefined}
              rel={uniSocialUrl !== "#" ? "noopener noreferrer" : undefined}
              aria-label={t.uniSocial}
              title={t.uniSocial}
            >
              <svg aria-hidden="true">
                <use href="#i-social" />
              </svg>
            </a>
            <button
              className="navbar-iconbtn navbar-search"
              type="button"
              id="searchToggle"
              aria-expanded="false"
              aria-controls="searchPanel"
              aria-label={t.search}
            >
              <svg aria-hidden="true">
                <use href="#i-search" />
              </svg>
            </button>
          </div>
        </div>

        <div className="search-panel" id="searchPanel" hidden>
          <div className="container">
            <form role="search">
              <svg aria-hidden="true">
                <use href="#i-search" />
              </svg>
              <input
                type="search"
                id="searchInput"
                placeholder={t.searchPlaceholder}
                aria-label={t.searchAria}
              />
              <button className="btn btn-gold btn-sm" type="submit">
                {t.search}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="menubar">
        <div className="container">
          <Link className="brand" href={siteHref(lang, "index.html")} aria-label={`${brandFull} — ${t.home}`}>
            <span className="brand-mark">
              <img className="brand-emblem" src="/assets/img/logo-official.png" alt="" width={112} height={112} />
            </span>
            <span className="brand-copy">
              {lang === "ar" ? (
                <span className="sr-only">{brandFull}</span>
              ) : null}
              <span
                className={lang === "ar" ? "brand-name thuluth gold-text" : "brand-name-en gold-text"}
                aria-hidden={lang === "ar" ? true : undefined}
              >
                {brandName}
              </span>
              {lang === "en" && (
                <span className="brand-sub-en">{settings.get("site.taglineEn") || "Sciences & Studies"}</span>
              )}
            </span>
          </Link>

          <nav className="mainnav" id="mainnav" aria-label={t.mainNav}>
            <ul className="mainnav-list">
              {nav.map((item) => {
                const active = item.href === "index.html" ? currentSlug === "index" : currentSlug === item.href.replace(/\.html$/, "");
                return (
                  <li key={item.id} className={item.children.length ? "has-drop" : undefined}>
                    <Link
                      className="nav-item"
                      href={siteHref(lang, item.href)}
                      aria-current={active ? "page" : undefined}
                    >
                      <em>
                        {lang === "ar" ? item.labelAr : item.labelEn}
                      </em>
                    </Link>
                    {item.children.length > 0 && (
                      <div className="drop">
                        {item.children.map((c) => (
                          <Link key={c.id} href={siteHref(lang, c.href)} target={c.href.startsWith("http") ? "_blank" : undefined} rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}>
                            {lang === "ar" ? c.labelAr : c.labelEn}
                          </Link>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="menubar-end">
            <Link className="accreditation-link" href={siteHref(lang, "accreditation.html")} aria-label={t.accreditation}>
              <span className="accreditation-logo">
                <img src="/assets/img/university-logo.png" alt="" width={40} height={40} />
              </span>
              <span className={lang === "ar" ? "thuluth gold-text" : undefined}>{t.accreditation}</span>
            </Link>
            <Link className="btn btn-gold btn-student" href={siteHref(lang, "student-login.html")}>
              <span className="btn-student-ic">
                <svg aria-hidden="true">
                  <use href="#i-student" />
                </svg>
              </span>
              <span className="btn-student-label">{t.login}</span>
            </Link>
            <button className="nav-toggle" type="button" aria-expanded="false" aria-controls="mainnav" aria-label={t.menu}>
              <svg aria-hidden="true">
                <use href="#i-menu" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
