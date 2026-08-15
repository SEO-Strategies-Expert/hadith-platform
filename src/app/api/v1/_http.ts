/**
 * أدوات HTTP مشتركة لمسارات تطبيق الجوال: CORS، والترقيم، وقراءة المعاملات.
 *
 * ═══════════════════════ قرار CORS ═══════════════════════
 *
 * التطبيق الأصيل (Expo على iOS/Android) **لا يخضع لـCORS أصلًا**: لا مُتصفّح
 * ولا ترويسة `Origin`، فالسياسة لا تُطبَّق عليه. إذًا كل ما نكتبه هنا يخدم
 * عملاء المتصفّح وحدهم: نسخة Expo Web، وخادم التطوير المحلّي.
 * ولذلك **لا نفتحها لكل الأصول بلا تمييز**، بل على مستويين:
 *
 *  • `public` — المسارات المفتوحة بلا مصادقة (المقرّرات، الأخبار، الهيئة،
 *    المجالس العامّة، التحقّق من وثيقة). بياناتها منشورة على الموقع نفسه
 *    لمن لا يملك حسابًا، فمنعُ قراءتها من أصلٍ آخر حمايةٌ وهميّة لا تزيد شيئًا.
 *    نضع `*` — وهو **آمن هنا بالتحديد** لأنّ المواصفة تمنع اجتماع `*` مع
 *    `Allow-Credentials`، فلا يمكن لموقعٍ خبيث أن يستدرج بها جلسة أحد.
 *
 *  • `app` — كل ما يحتاج `Bearer`. هنا قائمة سماحٍ مغلقة تُقرأ من
 *    `MOBILE_WEB_ORIGINS` (أصول مفصولة بفواصل)، ويُضاف إليها في غير الإنتاج
 *    عناوين خادم Expo المحلّيّة. الأصل غير المدرَج لا يُردّ عليه بترويسة
 *    سماح إطلاقًا — والطلب نفسه يُنفَّذ (المتصفّح هو من يحجب القراءة)، وهذا
 *    مقصود: التطبيق الأصيل بلا `Origin` يجب أن يعمل في كل الأحوال.
 *
 * **ولا نُصدر `Access-Control-Allow-Credentials` في أيّ مستوى.** المصادقة هنا
 * برمز `Bearer` يحمله التطبيق بنفسه، لا بكعكة يرسلها المتصفّح تلقائيًّا؛
 * وإعلان دعم الاعتماديّات يفتح بابًا لا نحتاجه أصلًا.
 */
import { NextResponse } from "next/server";
import { ApiError } from "@/lib/api-auth";

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------

export type CorsTier = "public" | "app";

/** أصول التطوير المحلّيّة لـExpo — لا تُقبل في الإنتاج مهما كان. */
const DEV_ORIGINS = [
  "http://localhost:8081",
  "http://localhost:19006",
  "http://127.0.0.1:8081",
  "http://127.0.0.1:19006",
];

function allowedOrigins(): string[] {
  const fromEnv = (process.env.MOBILE_WEB_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return process.env.NODE_ENV === "production" ? fromEnv : [...fromEnv, ...DEV_ORIGINS];
}

function corsHeaders(req: Request, tier: CorsTier, methods: string): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "600",
    // الردّ يختلف باختلاف الأصل، فبدون هذه قد تُسلّم ذاكرةٌ وسيطة ردَّ أصلٍ لآخر.
    Vary: "Origin",
  };

  if (tier === "public") {
    headers["Access-Control-Allow-Origin"] = "*";
    return headers;
  }

  const origin = req.headers.get("origin");
  if (origin && allowedOrigins().includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

/** يُلبس ردًّا جاهزًا ترويسات CORS المناسبة ويعيده. */
export function cors<R extends Response>(
  req: Request,
  res: R,
  tier: CorsTier,
  methods = "GET, OPTIONS"
): R {
  for (const [k, v] of Object.entries(corsHeaders(req, tier, methods))) {
    res.headers.set(k, v);
  }
  return res;
}

/** ردّ الفحص المسبق (`OPTIONS`) — بلا جسم، ٢٠٤. */
export function preflight(req: Request, tier: CorsTier, methods: string): Response {
  return cors(req, new NextResponse(null, { status: 204 }), tier, methods);
}

// ---------------------------------------------------------------------------
// الترقيم
// ---------------------------------------------------------------------------

/** سقفٌ صلب: لا يُعيد أيّ مسارٍ أكثر من هذا مهما طلب العميل. */
export const MAX_LIMIT = 50;
export const DEFAULT_LIMIT = 20;

export interface Paging {
  limit: number;
  cursor: string | null;
}

/** يقرأ `?limit=&cursor=` ويقيّد الحدّ — طلبٌ بلا حدّ لا يعني «كل الجدول». */
export function paging(req: Request, def = DEFAULT_LIMIT, max = MAX_LIMIT): Paging {
  const sp = new URL(req.url).searchParams;
  const raw = Number(sp.get("limit"));
  const limit = Number.isFinite(raw) && raw > 0 ? Math.min(Math.floor(raw), max) : Math.min(def, max);
  const cursor = sp.get("cursor")?.trim() || null;
  return { limit, cursor };
}

/**
 * معاملات مؤشّر Prisma — نتخطّى صفّ المؤشّر نفسه لئلّا يتكرّر بين صفحتين.
 * النوع مُصرَّح به لا مستنبَطًا: بدونه يصير الناتج اتّحادَ شكلين، فتفشل
 * استنباطات Prisma العامّة عند نشره في معاملات الاستعلام.
 */
export function cursorArgs(cursor: string | null): { cursor?: { id: string }; skip?: number } {
  return cursor ? { cursor: { id: cursor }, skip: 1 } : {};
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

/**
 * يقصّ صفًّا زائدًا واحدًا جُلب عمدًا (`take: limit + 1`) ليُعرف وجود تالٍ
 * بلا استعلام عدٍّ ثانٍ.
 */
export function page<T extends { id: string }>(rows: T[], limit: number): Page<T> {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  return { items, nextCursor: hasMore && items.length ? items[items.length - 1].id : null };
}

/**
 * ترقيمٌ على قائمةٍ في الذاكرة — لمسارات تعتمد دوالّ `lib/lms.ts` الجاهزة
 * التي تُرجع مجموعةً مقيَّدةً بالمستخدم أصلًا (تسجيلاته، وثائقه). المقصود
 * تحديد **حجم الردّ**، لا تخفيف الاستعلام.
 */
export function slicePage<T extends { id: string }>(
  all: readonly T[],
  { limit, cursor }: Paging
): Page<T> {
  const at = cursor ? all.findIndex((r) => r.id === cursor) : -1;
  const start = at >= 0 ? at + 1 : 0;
  return page([...all.slice(start, start + limit + 1)], limit);
}

// ---------------------------------------------------------------------------
// قراءة المعاملات والأجسام
// ---------------------------------------------------------------------------

export function query(req: Request, key: string): string | null {
  return new URL(req.url).searchParams.get(key)?.trim() || null;
}

/** «صواب» بأي صيغة شائعة: `1` و`true` و`yes`. */
export function queryFlag(req: Request, key: string): boolean {
  const v = query(req, key)?.toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export function text(v: unknown): string | null {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
}

/** معرّفٌ من المسار، أو 400 — لا نمرّر فراغًا إلى استعلام. */
export function requireId(v: string | undefined, label = "المعرّف"): string {
  const s = (v ?? "").trim();
  if (!s) throw new ApiError(400, `${label} مطلوب`);
  return s;
}

/**
 * رابط ملفٍّ خارجيّ بصيغة مقبولة — نرفض `javascript:` و`data:` وما شابههما.
 * (منقول عمدًا بنفس قاعدة `student-quiz-actions.ts` ليتطابق سلوك الويب والتطبيق.)
 */
export function safeUrl(v: unknown): string | null {
  const s = String(v ?? "").trim();
  if (s === "") return null;
  if (!/^https?:\/\//i.test(s)) throw new ApiError(400, "الرابط يجب أن يبدأ بـ http:// أو https://");
  return s;
}
