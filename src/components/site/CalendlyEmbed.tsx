"use client";

import { useRef } from "react";
import Script from "next/script";
import type { Lang } from "@/lib/site-data";

const WIDGET_SRC = "https://assets.calendly.com/assets/external/widget.js";

/** ارتفاعٌ يكفي لعرض شهرٍ كاملٍ مع قائمة الأوقات بلا تمريرٍ داخليّ مزدوج. */
const DEFAULT_HEIGHT = 700;

const T = {
  ar: {
    soonTitle: "الحجز سيُتاح قريبًا",
    soonBody:
      "لم يُفعَّل تقويم المقابلات بعد. راسل قسم القبول لتحديد موعدك، أو عُد إلى هذه الصفحة بعد قليل.",
  },
  en: {
    soonTitle: "Booking opens soon",
    soonBody:
      "The interview calendar is not live yet. Please contact the admissions department to arrange your slot, or check back shortly.",
  },
} as const;

interface CalendlyWindow extends Window {
  Calendly?: { initInlineWidget(options: { url: string; parentElement: Element }): void };
}

/**
 * يضيف معاملات التعبئة المسبقة إلى رابط الحجز.
 * المدير قد يلصق رابطًا فيه معاملات أصلًا (utm_ أو hide_gdpr_banner)، فنبني على
 * URL بدل لصق `?` نصًّا. ورابطٌ مشوَّه لا يُسقط الصفحة — يُمرَّر كما هو ولتُظهر
 * Calendly خطأها بنفسها.
 */
function buildUrl(url: string, name?: string | null, email?: string | null): string {
  try {
    const u = new URL(url);
    if (name) u.searchParams.set("name", name);
    if (email) u.searchParams.set("email", email);
    return u.toString();
  } catch {
    return url;
  }
}

export function CalendlyEmbed({
  url,
  lang,
  name,
  email,
  height = DEFAULT_HEIGHT,
}: {
  /** رابط الحجز من الإعدادات — null حين لم يُضبط بعد. */
  url: string | null;
  lang: Lang;
  name?: string | null;
  email?: string | null;
  height?: number;
}) {
  const t = T[lang];
  const holder = useRef<HTMLDivElement>(null);
  const src = url ? buildUrl(url, name, email) : null;

  if (!src) {
    return (
      <div className="callout reveal">
        <h3>{t.soonTitle}</h3>
        <p>{t.soonBody}</p>
      </div>
    );
  }

  return (
    <>
      {/* الأداة إطارٌ مستقلٌّ بواجهةٍ إنجليزيّة LTR؛ نعزلها بـdir=ltr لئلّا ترث
          اتّجاه الصفحة العربيّة فتنقلب حوافّها، مع إبقائها بعرض الحاوية كاملًا. */}
      <div
        ref={holder}
        className="calendly-inline-widget reveal"
        data-url={src}
        dir="ltr"
        style={{ width: "100%", minWidth: 320, height, borderRadius: 18, overflow: "hidden" }}
      />
      <Script
        src={WIDGET_SRC}
        strategy="afterInteractive"
        // السكربت لا يُنفَّذ مرّتين بعد أوّل تحميل، فالعودة إلى الصفحة عبر تنقّل
        // داخلي كانت تترك الحاوية فارغة. onReady يُنادى عند كلّ تركيب، فنُهيّئ
        // الأداة يدويًّا؛ وشرطُ خلوّ الحاوية يمنع الازدواج مع التهيئة التلقائيّة
        // التي تجريها المكتبة على `.calendly-inline-widget` عند أوّل تحميل.
        onReady={() => {
          const w = window as CalendlyWindow;
          const el = holder.current;
          if (!el || !w.Calendly || el.childElementCount > 0) return;
          w.Calendly.initInlineWidget({ url: src, parentElement: el });
        }}
      />
    </>
  );
}
