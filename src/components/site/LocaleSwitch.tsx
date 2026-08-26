"use client";

import type { MouseEvent } from "react";

/**
 * Locale changes also change the document direction and the external CSS layer.
 * Those values live in the shared root layout, which Next preserves during a
 * client-side transition, so use a document navigation for this one boundary.
 */
export function LocaleSwitch({
  href,
  hrefLang,
  lang,
  children,
}: {
  href: string;
  hrefLang: "ar" | "en";
  lang: "ar" | "en";
  children: React.ReactNode;
}) {
  function changeLocale(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    window.location.assign(href);
  }

  return (
    <a className="lang-switch" href={href} hrefLang={hrefLang} lang={lang} onClick={changeLocale}>
      {children}
    </a>
  );
}
