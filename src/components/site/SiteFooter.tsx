import Link from "next/link";
import type { Lang } from "@/lib/site-data";
import { getFooterNav, getSocialLinks, getSettingsMap } from "@/lib/site-data";
import { siteHref } from "@/lib/site-links";

const T = {
  ar: { legal: "روابط نظامية", rights: "جميع الحقوق محفوظة" },
  en: { legal: "Legal links", rights: "All rights reserved" },
} as const;

const LEGAL = [
  { href: "privacy.html", ar: "سياسة الخصوصية", en: "Privacy policy" },
  { href: "terms.html", ar: "شروط الاستخدام", en: "Terms of use" },
  { href: "intellectual-property.html", ar: "حقوق الملكية الفكرية", en: "Intellectual property" },
];

export async function SiteFooter({ lang }: { lang: Lang }) {
  const [groups, social, settings] = await Promise.all([
    getFooterNav(),
    getSocialLinks(),
    getSettingsMap(),
  ]);
  const t = T[lang];
  const brandName = lang === "ar" ? settings.get("site.shortAr") : settings.get("site.shortEn");
  const tagline = lang === "ar" ? settings.get("site.taglineAr") : settings.get("site.taglineEn");
  const year = new Date().getFullYear();

  return (
    <>
      <svg className="waves" viewBox="0 0 1440 132" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0,60 C170,112 315,12 490,44 C665,76 780,124 960,94 C1130,66 1265,14 1440,52 L1440,132 L0,132 Z" fill="#2A669F" opacity=".24" />
        <path d="M0,82 C180,34 330,118 512,84 C700,48 812,10 992,44 C1160,76 1288,120 1440,80 L1440,132 L0,132 Z" fill="#1D5089" opacity=".32" />
        <path d="M0,104 C195,72 335,126 525,108 C725,88 835,52 1015,74 C1185,94 1292,124 1440,104 L1440,132 L0,132 Z" fill="#0C2447" />
        <path d="M0,104 C195,72 335,126 525,108 C725,88 835,52 1015,74 C1185,94 1292,124 1440,104" fill="none" stroke="#D9AE4B" strokeWidth="1.5" opacity=".5" />
      </svg>

      <footer className="site-foot orn-navy">
        <div className="container">
          <div className="foot-top">
            <div className="foot-brand">
              <div className="row">
                <img src="/assets/img/logo-official.png" alt="" width={76} height={76} loading="lazy" />
                <span className={lang === "ar" ? "nm thuluth gold-text" : "nm gold-text"} style={lang === "en" ? { fontFamily: "Georgia,serif" } : undefined}>
                  {brandName}
                </span>
              </div>
              <p>{tagline}</p>
              <div className="foot-social">
                {social.map((s) => (
                  <a
                    key={s.id}
                    href={s.url || "#"}
                    aria-label={lang === "ar" ? s.labelAr : s.labelEn}
                    target={s.url && s.url !== "#" ? "_blank" : undefined}
                    rel={s.url && s.url !== "#" ? "noopener noreferrer" : undefined}
                  >
                    <svg className="brandicon" aria-hidden="true">
                      <use href={`#${s.icon}`} />
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            {[...groups.entries()].map(([group, links]) => {
              const heading = links.find((l) => (lang === "ar" ? l.labelAr : l.labelEn) && l.href === "");
              const items = links.filter((l) => l.href !== "");
              return (
                <div className="foot-col" key={group}>
                  <h5>{heading ? (lang === "ar" ? heading.labelAr : heading.labelEn) : group}</h5>
                  {items.map((l) => (
                    <Link key={l.id} href={siteHref(lang, l.href)}>
                      {lang === "ar" ? l.labelAr : l.labelEn}
                    </Link>
                  ))}
                </div>
              );
            })}
          </div>

          <div className="foot-bottom">
            <span>
              © <span id="yr">{year}</span> {settings.get(lang === "ar" ? "site.nameAr" : "site.nameEn")} — {t.rights}
            </span>
            <nav aria-label={t.legal}>
              {LEGAL.map((l) => (
                <Link key={l.href} href={siteHref(lang, l.href)}>
                  {lang === "ar" ? l.ar : l.en}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </footer>
    </>
  );
}
