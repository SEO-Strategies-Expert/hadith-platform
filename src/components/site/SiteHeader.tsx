import Link from "next/link";
import type { Lang } from "@/lib/site-data";
import { getHeaderNav, getSocialLinks, getSettingsMap } from "@/lib/site-data";
import { siteHref, counterpartHref } from "@/lib/site-links";

const T = {
  ar: {
    platforms: "منصّات الكلّية",
    quickLinks: "روابط سريعة",
    journal: "المجلة العلمية",
    forum: "منتدى الطلاب",
    switchTo: "English",
    search: "بحث",
    searchAria: "بحث في الموقع",
    searchPlaceholder: "ابحث في الكلّية — البرامج، الأبحاث، المجالس…",
    mainNav: "التنقّل الرئيسي",
    login: "دخول الطالب",
    menu: "القائمة",
    home: "الرئيسية",
  },
  en: {
    platforms: "College platforms",
    quickLinks: "Quick links",
    journal: "Academic Journal",
    forum: "Student Forum",
    switchTo: "العربية",
    search: "Search",
    searchAria: "Search the site",
    searchPlaceholder: "Search the college — programs, research, councils…",
    mainNav: "Main navigation",
    login: "Student Login",
    menu: "Menu",
    home: "Home",
  },
} as const;

export async function SiteHeader({ lang, currentSlug }: { lang: Lang; currentSlug: string }) {
  const [nav, social, settings] = await Promise.all([
    getHeaderNav(),
    getSocialLinks(),
    getSettingsMap(),
  ]);
  const t = T[lang];
  const brandName = lang === "ar" ? settings.get("site.shortAr") : settings.get("site.shortEn");
  const brandFull = lang === "ar" ? settings.get("site.nameAr") : settings.get("site.nameEn");

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
            <Link href={siteHref(lang, "publications.html")}>
              <svg aria-hidden="true">
                <use href="#i-journal" />
              </svg>{" "}
              {t.journal}
            </Link>
            <Link href={siteHref(lang, "student-login.html")}>
              <svg aria-hidden="true">
                <use href="#i-forum" />
              </svg>{" "}
              {t.forum}
            </Link>
            <Link
              className="lang-switch"
              href={counterpartHref(lang, currentSlug)}
              hrefLang={lang === "ar" ? "en" : "ar"}
              lang={lang === "ar" ? "en" : "ar"}
            >
              <svg aria-hidden="true">
                <use href="#i-globe" />
              </svg>{" "}
              {t.switchTo}
            </Link>
          </nav>

          <button
            className="navbar-search"
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
                      <span className="ic">
                        <svg aria-hidden="true">
                          <use href={`#${item.icon ?? "i-arrow"}`} />
                        </svg>
                      </span>
                      <em>{lang === "ar" ? item.labelAr : item.labelEn}</em>
                    </Link>
                    {item.children.length > 0 && (
                      <div className="drop">
                        {item.children.map((c) => (
                          <Link key={c.id} href={siteHref(lang, c.href)}>
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
            <Link className="btn btn-gold" href={siteHref(lang, "student-login.html")}>
              <svg aria-hidden="true">
                <use href="#i-student" />
              </svg>{" "}
              {t.login}
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
