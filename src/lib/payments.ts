/**
 * الرسوم والمدفوعات — الحساب والتنسيق.
 *
 * لماذا هذا الملفّ بلا استيراد قيمةٍ واحدة (لا `prisma` ولا `site-format`)؟
 * لأنّ المال لا يُختبر عبر قاعدة بياناتٍ حيّة. أبقيتُه وحدةً حسابيّةً صافية
 * تُستدعى بعد جلب السجلّات، فيمكن التحقّق من المجاميع وحدها بلا اتّصال ولا
 * محوِّل مسارات. لذلك كُرّرت هنا ثلاثة أسطر لتحويل الأرقام العربيّة بدل
 * استيراد `toArDigits` — ثمنٌ زهيد مقابل وحدةٍ ماليّةٍ قابلةٍ للاختبار.
 *
 * لا بوّابة دفع هنا ولا نيّة لبنائها: هذا **سجلّ ماليّ يدويّ** تُدوّن فيه
 * الإدارة ما وصلها (تحويل، نقدًا، إعفاء). حقلا `provider` و`providerRef` في
 * القاعدة مخصَّصان لبوّابةٍ تُضاف لاحقًا بلا إعادة كتابة هذا الملفّ.
 */
import type { Lang } from "@/lib/site-data";

// ---------------------------------------------------------------------------
// المفاتيح والمسمّيات
// ---------------------------------------------------------------------------

export const PAYMENT_STATUSES = [
  { value: "PENDING", ar: "قيد التأكيد", en: "Pending" },
  { value: "PAID", ar: "مسدَّدة", en: "Paid" },
  { value: "FAILED", ar: "متعثّرة", en: "Failed" },
  { value: "REFUNDED", ar: "مُستردَّة", en: "Refunded" },
  { value: "WAIVED", ar: "إعفاء", en: "Waived" },
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]["value"];

export const PAYMENT_METHODS = [
  { value: "transfer", ar: "تحويل بنكيّ", en: "Bank transfer" },
  { value: "cash", ar: "نقدًا", en: "Cash" },
  { value: "card", ar: "بطاقة", en: "Card" },
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]["value"];

/** نظام الرسوم المرن المعلَن في الموقع. */
export const FEE_OPTIONS = [
  { value: "free", ar: "مجّانيّ", en: "Free" },
  { value: "reduced", ar: "مخفَّض", en: "Reduced" },
  { value: "full", ar: "كامل", en: "Full" },
] as const;

export type FeeOption = (typeof FEE_OPTIONS)[number]["value"];

export function isPaymentStatus(v: unknown): v is PaymentStatus {
  return PAYMENT_STATUSES.some((s) => s.value === v);
}

export function isPaymentMethod(v: unknown): v is PaymentMethod {
  return PAYMENT_METHODS.some((m) => m.value === v);
}

export function statusLabel(v: string, lang: Lang = "ar"): string {
  const hit = PAYMENT_STATUSES.find((s) => s.value === v);
  return hit ? hit[lang] : v;
}

export function methodLabel(v: string | null | undefined, lang: Lang = "ar"): string {
  if (!v) return lang === "ar" ? "—" : "—";
  const hit = PAYMENT_METHODS.find((m) => m.value === v);
  return hit ? hit[lang] : v;
}

export function feeOptionLabel(v: string | null | undefined, lang: Lang = "ar"): string {
  const hit = FEE_OPTIONS.find((f) => f.value === (v ?? "free"));
  return hit ? hit[lang] : (v ?? "—");
}

/** ألوان شارات اللوحة — نفس أسماء نغمات `components/admin/ui`. */
export function statusBadgeTone(v: string): "gray" | "green" | "red" | "gold" | "blue" {
  if (v === "PAID") return "green";
  if (v === "WAIVED") return "gold";
  if (v === "FAILED") return "red";
  if (v === "REFUNDED") return "blue";
  return "gray";
}

export function statusOptions(lang: Lang = "ar"): { value: string; label: string }[] {
  return PAYMENT_STATUSES.map((s) => ({ value: s.value, label: s[lang] }));
}

export function methodOptions(lang: Lang = "ar"): { value: string; label: string }[] {
  return PAYMENT_METHODS.map((m) => ({ value: m.value, label: m[lang] }));
}

// ---------------------------------------------------------------------------
// المبالغ — لماذا وحدةٌ صغرى بـ`bigint` لا `number`
// ---------------------------------------------------------------------------
//
// `Payment.amount` في القاعدة `Decimal @db.Decimal(10,2)`، ويصل من Prisma
// كائنَ `Decimal` (decimal.js) لا رقمًا عاديًّا. جمعُه بـ`Number(...) + ...`
// يُدخل خطأ الفاصلة العائمة (٠٫١ + ٠٫٢ = ٠٫٣٠٠٠٠٠٠٠٠٠٠٠٠٠٠٠٤)، وعرضُه
// بـ`toString()` خامًّا يفقد الأصفار الأخيرة («١٠٫٥٠» تصير «10.5»).
//
// القاعدة المتّبعة هنا: **لا حسابَ عشريًّا أصلًا**. يُقرأ المبلغ نصًّا
// (`Decimal.toFixed(2)` — تمثيلٌ عشريّ مضبوط لا يمرّ بـ`double`)، ثمّ يُحوَّل
// إلى عددٍ صحيح من الوحدة الصغرى (الدرهم القطريّ = ١٪ من الريال) ويُجمع
// جمعَ أعدادٍ صحيحة. جمع الصحيح في JavaScript مضبوطٌ تمامًا ما دام داخل
// `Number.MAX_SAFE_INTEGER`، والسقف هنا بعيدٌ جدًّا: `Decimal(10,2)` أقصاه
// ٩٩٬٩٩٩٬٩٩٩٫٩٩ أي ١٠¹⁰ وحدة صغرى، فيلزم نحو ٩٠٠ ألف دفعةٍ بأقصى قيمةٍ
// ممكنة قبل الاقتراب من الحدّ. (لم أستعمل `bigint` لأنّ `target` المشروع
// ES2017 ولا أملك `tsconfig.json`.) والتنسيق يعيد الفاصلة إلى موضعها عند
// العرض وحده، فلا كسرَ يضيع ولا خطأ عائمٍ يتراكم.

/** كلّ ما يمكن أن يصل منه مبلغ: `Prisma.Decimal` أو نصّ أو رقم. */
export type DecimalLike = string | number | { toFixed(dp: number): string };

export const DEFAULT_CURRENCY = "QAR";

const MONEY_RE = /^([+-])?(\d+)(?:\.(\d*))?$/;

/**
 * يحوّل مبلغًا إلى عددٍ **صحيح** من الوحدة الصغرى (٪١ من العملة).
 * التقريب نصفيٌّ لأعلى على الرقم الثالث — لا يقع عمليًّا لأنّ القاعدة
 * تحفظ منزلتين، لكنّه يحمي من نصٍّ يدويّ فيه منازل زائدة.
 */
export function toMinor(amount: DecimalLike): number {
  const raw = typeof amount === "string" ? amount.trim() : amount.toFixed(2);
  const s = raw.startsWith(".") ? `0${raw}` : raw;
  const m = MONEY_RE.exec(s);
  // مبلغٌ غير صالحٍ خطأُ بيانات لا يُبتلع صامتًا: صفرٌ صامت يفسد مجموعًا ماليًّا.
  if (!m) throw new Error(`مبلغ غير صالح: ${raw}`);

  const negative = m[1] === "-";
  const frac = (m[3] ?? "").padEnd(3, "0");
  // كلّ عمليّةٍ هنا على أعدادٍ صحيحة: لا ضرب في ١٠٠ لعددٍ كسريّ ولا `parseFloat`.
  const base = Number(m[2]) * 100 + Number(frac.slice(0, 2));
  if (!Number.isSafeInteger(base)) throw new Error(`مبلغ يتجاوز المدى الآمن: ${raw}`);
  const rounded = frac.charCodeAt(2) >= 53 /* '5' */ ? base + 1 : base;
  return negative ? -rounded : rounded;
}

/** يعيد الوحدة الصغرى إلى نصٍّ عشريٍّ بمنزلتين، بلا حسابٍ عائم. */
export function minorToPlain(minor: number): string {
  const negative = minor < 0;
  const abs = Math.abs(Math.trunc(minor));
  const int = String(Math.trunc(abs / 100));
  const frac = String(abs % 100).padStart(2, "0");
  return `${negative ? "-" : ""}${int}.${frac}`;
}

// ---------------------------------------------------------------------------
// التنسيق للعرض
// ---------------------------------------------------------------------------

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/** أرقامٌ عربيّة-هنديّة — مكرَّرة من `site-format` عمدًا (انظر رأس الملفّ). */
function arDigits(s: string): string {
  return s.replace(/[0-9]/g, (d) => AR_DIGITS[+d]);
}

const CURRENCY_SYMBOLS: Record<string, { ar: string; en: string }> = {
  QAR: { ar: "ر.ق", en: "QAR" },
  SAR: { ar: "ر.س", en: "SAR" },
  AED: { ar: "د.إ", en: "AED" },
  KWD: { ar: "د.ك", en: "KWD" },
  EGP: { ar: "ج.م", en: "EGP" },
  USD: { ar: "دولار", en: "USD" },
  EUR: { ar: "يورو", en: "EUR" },
};

export function currencyLabel(currency: string | null | undefined, lang: Lang = "ar"): string {
  const code = (currency || DEFAULT_CURRENCY).toUpperCase();
  return CURRENCY_SYMBOLS[code]?.[lang] ?? code;
}

function group(digits: string, sep: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
}

/** مبلغٌ من الوحدة الصغرى منسَّقًا: «١٢٣٬٤٥٦٫٧٨ ر.ق» / «QAR 123,456.78». */
export function formatMinor(
  minor: number,
  currency: string | null | undefined = DEFAULT_CURRENCY,
  lang: Lang = "ar"
): string {
  const plain = minorToPlain(minor);
  const negative = plain.startsWith("-");
  const [int, frac] = (negative ? plain.slice(1) : plain).split(".");
  const sym = currencyLabel(currency, lang);

  if (lang === "en") {
    return `${negative ? "-" : ""}${group(int, ",")}.${frac} ${sym}`;
  }
  // الفاصلة العشريّة العربيّة (U+066B) وفاصل الآلاف العربيّ (U+066C).
  return `${negative ? "؜-" : ""}${arDigits(group(int, "٬"))}٫${arDigits(frac)} ${sym}`;
}

/** مبلغُ سجلٍّ واحد كما يصل من Prisma. */
export function formatAmount(
  amount: DecimalLike,
  currency: string | null | undefined = DEFAULT_CURRENCY,
  lang: Lang = "ar"
): string {
  return formatMinor(toMinor(amount), currency, lang);
}

// ---------------------------------------------------------------------------
// المجاميع
// ---------------------------------------------------------------------------

/** أقلّ ما يلزم لحساب المجاميع — يقبل سجلّ Prisma كما هو. */
export type PaymentRecord = {
  amount: DecimalLike;
  currency?: string | null;
  status: string;
};

/** كل المبالغ هنا **بالوحدة الصغرى** (أعداد صحيحة) — تُنسَّق بـ`formatMinor`. */
export type PaymentTotals = {
  currency: string;
  /** المحصَّل فعلًا: `PAID` وحدها. */
  collected: number;
  /** لم يُؤكَّد بعد. */
  pending: number;
  /**
   * إعفاءات — مبالغُها للتوثيق لا للتحصيل، فلا تدخل `collected` أبدًا.
   * هذا جوهر نظام الكلّية: «مجّانًا» ليس دَينًا مؤجَّلًا.
   */
  waived: number;
  refunded: number;
  failed: number;
  /** صافي ما في اليد بعد الاستردادات. */
  net: number;
  counts: {
    total: number;
    paid: number;
    pending: number;
    waived: number;
    refunded: number;
    failed: number;
  };
};

function emptyTotals(currency: string): PaymentTotals {
  return {
    currency,
    collected: 0,
    pending: 0,
    waived: 0,
    refunded: 0,
    failed: 0,
    net: 0,
    counts: { total: 0, paid: 0, pending: 0, waived: 0, refunded: 0, failed: 0 },
  };
}

function currencyOf(r: PaymentRecord): string {
  return (r.currency || DEFAULT_CURRENCY).toUpperCase();
}

function accumulate(t: PaymentTotals, r: PaymentRecord): void {
  const minor = toMinor(r.amount);
  t.counts.total += 1;
  switch (r.status) {
    case "PAID":
      t.collected += minor;
      t.counts.paid += 1;
      break;
    case "PENDING":
      t.pending += minor;
      t.counts.pending += 1;
      break;
    case "WAIVED":
      t.waived += minor;
      t.counts.waived += 1;
      break;
    case "REFUNDED":
      t.refunded += minor;
      t.counts.refunded += 1;
      break;
    case "FAILED":
      t.failed += minor;
      t.counts.failed += 1;
      break;
    default:
      // حالةٌ غير معروفة تُعدّ ولا تُحتسب في أي مجموع — أسلمُ من نسبتها خطأً.
      break;
  }
  t.net = t.collected - t.refunded;
}

/**
 * مجاميع عملةٍ واحدة. يعيد صفًّا بأصفارٍ حتّى لو خلت القائمة، فالشاشة
 * تعرض «٠٫٠٠» بدل فراغٍ يوهم بعطل.
 */
export function summarize(
  records: readonly PaymentRecord[],
  currency: string = DEFAULT_CURRENCY
): PaymentTotals {
  const code = currency.toUpperCase();
  const totals = emptyTotals(code);
  for (const r of records) {
    if (currencyOf(r) !== code) continue;
    accumulate(totals, r);
  }
  return totals;
}

/**
 * مجاميع مفصولةٌ بالعملة. جمع عملتين في رقمٍ واحد كذبٌ حسابيّ، فالفصل
 * إلزاميّ ولو كانت الأخرى سجلًّا واحدًا.
 */
export function summarizeByCurrency(records: readonly PaymentRecord[]): PaymentTotals[] {
  const map = new Map<string, PaymentTotals>();
  for (const r of records) {
    const code = currencyOf(r);
    let totals = map.get(code);
    if (!totals) {
      totals = emptyTotals(code);
      map.set(code, totals);
    }
    accumulate(totals, r);
  }
  // العملة الافتراضيّة أوّلًا ثمّ الباقي أبجديًّا — ترتيبٌ ثابت لا يقفز بين التصييرات.
  return [...map.values()].sort((a, b) => {
    if (a.currency === DEFAULT_CURRENCY) return -1;
    if (b.currency === DEFAULT_CURRENCY) return 1;
    return a.currency.localeCompare(b.currency);
  });
}

// ---------------------------------------------------------------------------
// ملخّص الطالب
// ---------------------------------------------------------------------------

export type StudentEnrollmentFee = {
  id: string;
  feeOption?: string | null;
};

export type StudentPaymentRecord = PaymentRecord & { enrollmentId?: string | null };

export type StudentFinancials = {
  /** مجاميع كلّ عملةٍ ظهرت في دفعات الطالب. */
  byCurrency: PaymentTotals[];
  /** مجاميع العملة الافتراضيّة دائمًا — لبطاقة الملخّص الرئيسة. */
  primary: PaymentTotals;
  /** نظام الرسوم لكل تسجيل: `enrollmentId` → `full | reduced | free`. */
  feeByEnrollment: Map<string, FeeOption>;
  /** هل كلّ مسارات الطالب مجّانيّة؟ عندها لا يُعرض له حديثٌ عن مبالغ أصلًا. */
  allFree: boolean;
  /** هل عليه شيءٌ قيد التأكيد؟ (بلا لغة مطالبة في الواجهة) */
  hasPending: boolean;
};

/**
 * يجمع صورة الطالب الماليّة من تسجيلاته ودفعاته.
 * دالّةٌ صافية: الاستعلام (المقيَّد بـ`userId` الجلسة) مسؤوليّة المستدعي.
 */
export function studentFinancials(
  enrollments: readonly StudentEnrollmentFee[],
  payments: readonly StudentPaymentRecord[]
): StudentFinancials {
  const feeByEnrollment = new Map<string, FeeOption>();
  for (const e of enrollments) {
    const v = (e.feeOption ?? "free") as FeeOption;
    feeByEnrollment.set(e.id, FEE_OPTIONS.some((f) => f.value === v) ? v : "free");
  }

  const byCurrency = summarizeByCurrency(payments);
  const primary =
    byCurrency.find((t) => t.currency === DEFAULT_CURRENCY) ?? summarize(payments, DEFAULT_CURRENCY);

  return {
    byCurrency,
    primary,
    feeByEnrollment,
    allFree:
      enrollments.length > 0 && enrollments.every((e) => (e.feeOption ?? "free") === "free"),
    hasPending: byCurrency.some((t) => t.pending !== 0),
  };
}
