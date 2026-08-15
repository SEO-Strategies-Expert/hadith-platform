"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";

/**
 * زرّ نسخ رابط التحقّق جاهزًا للمشاركة.
 *
 * يُبنى المضيف من `window.location.origin` لا من متغيّر بيئة: اللوحة تُفتح على
 * النطاق نفسه الذي تُفتح منه صفحة التحقّق، فيصحّ الرابط في الإنتاج وفي
 * التطوير المحلّي بلا إعداد.
 */
export function CopyVerifyLink({ path, label = "انسخ رابط التحقّق" }: { path: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = typeof window === "undefined" ? path : `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // متصفّحٌ يمنع الحافظة (سياقٌ غير آمن) — نُظهر الرابط ليُنسخ يدويًّا.
      window.prompt("انسخ رابط التحقّق:", url);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={copy}
        className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-[13px] font-bold text-navy-800 transition hover:border-gold/50"
      >
        {copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
        {copied ? "نُسخ الرابط" : label}
      </button>
      <a
        href={path}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-[13px] font-bold text-navy-800 transition hover:border-gold/50"
      >
        <ExternalLink size={15} /> افتح صفحة التحقّق
      </a>
    </div>
  );
}
