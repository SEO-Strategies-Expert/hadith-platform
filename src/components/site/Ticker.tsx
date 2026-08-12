import Link from "next/link";
import type { Lang } from "@/lib/site-data";
import { getTickerItems } from "@/lib/site-data";
import { siteHref } from "@/lib/site-links";

const T = {
  ar: { aria: "أحدث المستجدّات", tag: "مستجدّات الكلّية" },
  en: { aria: "Latest updates", tag: "College updates" },
} as const;

export async function Ticker({ lang }: { lang: Lang }) {
  const items = await getTickerItems(lang);
  if (items.length === 0) return null;
  const t = T[lang];
  const loop = [...items, ...items];

  return (
    <div className="ticker" aria-label={t.aria}>
      <span className="ticker-tag">
        <svg aria-hidden="true">
          <use href="#i-bell" />
        </svg>
        <span>{t.tag}</span>
      </span>
      <div className="ticker-track" id="tickerTrack">
        {loop.map((it, i) => (
          <Link key={i} href={siteHref(lang, it.href)}>
            {it.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
