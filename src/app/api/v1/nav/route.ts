/**
 * قائمة التنقّل الشاملة للتطبيق — عامّة بلا مصادقة.
 *
 * التطبيق يعرض «قائمة» (زرّ الثلاث شُرَط) تحاكي تنظيم الموقع نفسه، فلا
 * يجوز أن تُكتب عناصرها في كود التطبيق: الموقع يبني رأسه من `nav_links`
 * وأيقونات التواصل من `social_links` ورابط البثّ من `settings`، وأيّ
 * تعديلٍ يجريه المدير من لوحة التحكّم يجب أن يظهر في التطبيق كما ظهر في
 * الموقع بلا إصدارٍ جديد. فهذا المسار يُرجع الثلاثة من القاعدة حيًّا،
 * بنفس شروط `src/lib/site-data.ts` حرفًا بحرف (`visible` والترتيب).
 *
 * ثلاثة قرارات تستحقّ التسجيل:
 *
 *  ١) **الروابط الميّتة لا تخرج.** حقل `SocialLink.url` قيمته الافتراضيّة
 *     في المخطّط `"#"`، وبيانات العميل اليوم كلّها كذلك. الموقع يعرضها
 *     أيقوناتٍ لا تذهب إلى شيء — وهو مقبولٌ في صفحةٍ عريضة، أمّا في قائمة
 *     التطبيق فأيقونةٌ لا تفتح شيئًا عطبٌ ظاهر. فتُستبعد هنا في الخادم،
 *     ويُخفي التطبيق القسم كلّه إن خلا. وكذلك `header.liveUrl` الفارغ
 *     يخرج `null` لا `"#"`.
 *
 *  ٢) **`href` يخرج كما هو مخزَّنًا** (`about.html`، `faculty.html#council`،
 *     `https://sunnah.one/`) ومعه `external` محسوبًا. التحويل إلى مسارٍ
 *     كامل يحتاج لغة العرض، وهي عند العميل لا عندنا؛ فنُرسل الأصل وأصلَ
 *     الموقع (`site.url`) ويركّبهما التطبيق بلغته.
 *
 *  ٣) **أصل الموقع يُشتقّ من الطلب** لا من ثابتٍ مكتوب: الموقع وهذا المسار
 *     يخرجان من تطبيق Next واحد، فالمضيف الذي وصل إليه الطلب هو الموقع
 *     بعينه. وهذا وحده ما يجعل نسخة التطوير تفتح صفحات خادم التطوير
 *     ونسخة الإنتاج تفتح الإنتاج بلا ضبطٍ يدويّ. ويُقدَّم `SITE_URL` عليه
 *     إن ضُبط، للحالة التي يُقدَّم فيها الموقع من نطاقٍ غير نطاق الواجهة.
 */
import { prisma } from "@/lib/prisma";
import { ok, fail } from "../_lib";
import { cors, preflight } from "../_http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const METHODS = "GET, OPTIONS";

/** رابطٌ خارج الموقع — يُفتح في متصفّح النظام لا داخل التطبيق. */
function isExternal(href: string): boolean {
  return /^([a-z][a-z0-9+.-]*:)?\/\//i.test(href) || /^(mailto|tel):/i.test(href);
}

/**
 * رابطٌ ذو وجهة فعليّة. `"#"` و`""` هما شكلا «لم يُضبط بعد» في القاعدة،
 * وما بدأ بـ`#` وحده مرساةٌ في صفحة لا وجهة مستقلّة.
 */
function liveHref(v: string | null | undefined): string | null {
  const s = (v ?? "").trim();
  return s === "" || s.startsWith("#") ? null : s;
}

/**
 * قيمة إعدادٍ نصّيّة. العمود `Json`، فقد يكون نصًّا أو `{ar,en}` أو رقمًا؛
 * ولا نريد أن يخرج «[object Object]» كما يفعل `String()` المجرَّد.
 */
function settingText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

interface NavRow {
  id: string;
  labelAr: string;
  labelEn: string;
  href: string;
  icon: string | null;
}

/** الشجرة تُعرِّف نفسها بنفسها، فالنوع مُصرَّحٌ به لا مستنبَطًا. */
interface NavNode {
  id: string;
  labelAr: string;
  labelEn: string;
  href: string;
  icon: string | null;
  external: boolean;
  children: NavNode[];
}

function navNode(row: NavRow, children: NavRow[] = []): NavNode {
  return {
    id: row.id,
    labelAr: row.labelAr,
    labelEn: row.labelEn,
    href: row.href,
    icon: row.icon,
    external: isExternal(row.href),
    children: children.map((c) => navNode(c)),
  };
}

export async function OPTIONS(req: Request) {
  return preflight(req, "public", METHODS);
}

export async function GET(req: Request) {
  try {
    const select = { id: true, labelAr: true, labelEn: true, href: true, icon: true } as const;

    const [roots, socialRows, settingRows] = await Promise.all([
      // نفس شرط `getHeaderNav` وترتيبه؛ ويُضاف `id` فاصلًا ثانيًا كي لا
      // يتأرجح ترتيب عنصرين لهما نفس `order` بين طلبٍ وآخر.
      prisma.navLink.findMany({
        where: { menu: "HEADER", parentId: null, visible: true },
        orderBy: [{ order: "asc" }, { id: "asc" }],
        select: {
          ...select,
          children: {
            where: { visible: true },
            orderBy: [{ order: "asc" }, { id: "asc" }],
            select,
          },
        },
      }),
      prisma.socialLink.findMany({
        where: { visible: true },
        orderBy: [{ order: "asc" }, { id: "asc" }],
        select: { id: true, key: true, labelAr: true, labelEn: true, url: true, icon: true },
      }),
      prisma.setting.findMany({
        where: { key: { in: ["header.liveUrl", "site.nameAr", "site.nameEn", "site.shortAr", "site.shortEn"] } },
        select: { key: true, value: true },
      }),
    ]);

    const settings = new Map(settingRows.map((r) => [r.key, settingText(r.value)]));

    const url = new URL(req.url);
    const proto =
      req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || url.protocol.replace(":", "");
    const host =
      req.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
      req.headers.get("host") ||
      url.host;
    const siteUrl = (process.env.SITE_URL || `${proto}://${host}`).replace(/\/+$/, "");

    return cors(
      req,
      ok({
        site: {
          url: siteUrl,
          nameAr: settings.get("site.nameAr") || "",
          nameEn: settings.get("site.nameEn") || "",
          shortAr: settings.get("site.shortAr") || "",
          shortEn: settings.get("site.shortEn") || "",
        },
        header: roots.map((r) => navNode(r, r.children)),
        // الميّتة تُستبعد هنا لا في التطبيق: ما لا وجهة له لا يُعرض أصلًا.
        social: socialRows
          .map((s) => ({ ...s, url: liveHref(s.url) }))
          .filter((s): s is typeof s & { url: string } => s.url !== null)
          .map((s) => ({
            id: s.id,
            key: s.key,
            labelAr: s.labelAr,
            labelEn: s.labelEn,
            url: s.url,
            icon: s.icon,
          })),
        live: liveHref(settings.get("header.liveUrl")),
      }),
      "public",
      METHODS
    );
  } catch (e) {
    return cors(req, fail(e), "public", METHODS);
  }
}
