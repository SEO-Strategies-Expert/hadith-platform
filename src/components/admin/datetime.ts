/**
 * تحويل المواعيد بين قاعدة البيانات (UTC) وحقل `datetime-local` في المتصفّح.
 *
 * لماذا هذا الملفّ أصلًا؟ لأنّ خادم Vercel يعمل بتوقيت UTC بينما المدير يكتب
 * موعد المجلس بتوقيت الكلّية. لو تركنا `new Date(value)` يفسّر النصّ بتوقيت
 * الخادم لانزاح كل مجلس ثلاث ساعات، ولوصل الطلاب متأخّرين. فنثبّت التوقيت
 * على منطقة واحدة معلنة (نفس التي يستعملها Zoom) في العرض والقراءة معًا.
 */

export const SITE_TZ = process.env.ZOOM_TIMEZONE ?? "Asia/Qatar";

/** فرق المنطقة الزمنية عن UTC بالمللي ثانية عند لحظة بعينها. */
function tzOffsetMs(at: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"), get("second"));
  return asUtc - at.getTime();
}

/** تاريخ من القاعدة → نصّ يصلح لـ`<input type="datetime-local">` بتوقيت الكلّية. */
export function toLocalInput(value: Date | string | null | undefined): string | undefined {
  if (!value) return undefined;
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return undefined;
  return new Date(d.getTime() + tzOffsetMs(d, SITE_TZ)).toISOString().slice(0, 16);
}

/** نصّ الحقل → تاريخ صحيح، مفسَّرًا بتوقيت الكلّية لا بتوقيت الخادم. */
export function fromLocalInput(value: string | null | undefined): Date | null {
  if (!value) return null;
  // نفسّره أوّلًا كأنّه UTC لنعرف الإزاحة عند ذلك التاريخ تقريبًا، ثم نصحّحها.
  const guess = new Date(`${value.length === 16 ? value : value.slice(0, 16)}:00Z`);
  if (isNaN(guess.getTime())) return null;
  return new Date(guess.getTime() - tzOffsetMs(guess, SITE_TZ));
}

/** عرض موعد بصيغة عربيّة مقروءة (تاريخ + ساعة) بتوقيت الكلّية. */
export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("ar-QA", {
    timeZone: SITE_TZ,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}
