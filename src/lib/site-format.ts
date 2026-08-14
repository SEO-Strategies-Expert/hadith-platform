// مساعدات تنسيق مشتركة لتصيير أقسام الموقع من قاعدة البيانات.
import type { Lang } from "@/lib/site-data";

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export function toArDigits(n: number | string): string {
  return String(n).replace(/[0-9]/g, (d) => AR_DIGITS[+d]);
}

export function esc(s: string | null | undefined): string {
  if (!s) return "";
  return s.replace(/[&<>'"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c] as string)
  );
}

const AR_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];
const EN_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const EN_MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** تاريخ مقروء: «٢٨ يوليو ٢٠٢٦» / «28 July 2026». */
export function longDate(
  d: Date,
  lang: Lang,
  opts: { year?: boolean; arabicDigits?: boolean } = {}
): string {
  const withYear = opts.year !== false;
  const day = d.getUTCDate();
  const month = d.getUTCMonth();
  const year = d.getUTCFullYear();
  if (lang === "en") {
    return withYear ? `${day} ${EN_MONTHS[month]} ${year}` : `${day} ${EN_MONTHS[month]}`;
  }
  const dd = opts.arabicDigits ? toArDigits(day) : String(day);
  const yy = opts.arabicDigits ? toArDigits(year) : String(year);
  return withYear ? `${dd} ${AR_MONTHS[month]} ${yy}` : `${dd} ${AR_MONTHS[month]}`;
}

/** يوم/شهر مختصران لبطاقة التقويم: {d:"١٢", m:"أغسطس"} / {d:"12", m:"Aug"}. */
export function shortDateParts(d: Date, lang: Lang): { d: string; m: string } {
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = d.getUTCMonth();
  if (lang === "en") return { d: day, m: EN_MONTHS_SHORT[month] };
  return { d: toArDigits(day), m: AR_MONTHS[month] };
}

/**
 * يوحّد مسار وسائط مخزَّن (assets/img/x.jpg أو ../assets/img/x.jpg أو رابط Blob كامل)
 * إلى مسار صالح من جذر الموقع، فيعمل في النسختين العربية و/en معًا.
 */
export function mediaUrl(u: string | null | undefined, fallback?: string): string {
  const raw = (u ?? "").trim();
  if (!raw) return fallback ?? "";
  if (/^([a-z]+:)?\/\//i.test(raw) || raw.startsWith("data:")) return raw;
  if (raw.startsWith("/")) return raw;
  return "/" + raw.replace(/^(\.\.\/)+/, "").replace(/^\.\//, "");
}

/** نصّ البحث لبطاقة (تستخدمه فلاتر inner-pages.js). */
export function searchText(...parts: (string | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

export function pick<T>(lang: Lang, ar: T, en: T): T {
  return lang === "ar" ? ar : en;
}
