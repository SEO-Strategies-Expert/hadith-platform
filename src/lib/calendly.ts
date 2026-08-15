/**
 * تكامل Calendly لحجز «المقابلة العلميّة» — الخطوة الثالثة من خطوات القبول.
 *
 * التصميم — كتكامل Zoom — مقصود أن يعمل **قبل** ضبط الحساب وبعده بلا تغيير كود:
 *   - بلا رابط مضبوط → `getCalendlyUrl()` ترجع null، فتعرض الصفحة رسالة
 *     «الحجز سيُتاح قريبًا» بدل إطارٍ مكسور.
 *   - برابطٍ مضبوط من اللوحة → تظهر أداة الحجز، ويملأ الويب هوك موعدَ المقابلة
 *     ورابطها في طلب الالتحاق تلقائيًّا.
 *
 * الرابط يُقرأ من جدول `Setting` بالمفتاح `admissions.calendlyUrl` أوّلًا، حتى
 * يستطيع المدير تبديل نوع الحدث من اللوحة بلا نشرٍ جديد؛ ومتغيّر البيئة
 * `CALENDLY_SCHEDULING_URL` احتياطٌ لبيئات لا قاعدة بيانات محرَّرة فيها.
 *
 * ما يجب ضبطه في حساب Calendly:
 *   • نوع حدث (Event Type) للمقابلة العلميّة، ومكانه Zoom/Google Meet ليعود
 *     رابط اللقاء داخل الحدث (وإلّا بقي `interviewUrl` فارغًا).
 *   • اشتراك ويب هوك (webhook_subscriptions) على الأحداث invitee.created و
 *     invitee.canceled، برابط `https://<النطاق>/api/webhooks/calendly`
 *     و`signing_key` = قيمة `CALENDLY_WEBHOOK_SIGNING_KEY`.
 *
 * ⚠️ **صيغة التوقيع لم تُؤكَّد من وثيقة Calendly الرسميّة.** وثائقهم تُحمَّل
 * بجافاسكربت فتعذّرت قراءتها آليًّا، والمصادر الثانويّة متضاربة:
 *   (أ) صيغة مركّبة: ترويسة `t=<ts>,v1=<hex>` والتوقيع على `${t}.${rawBody}`.
 *   (ب) صيغة بسيطة: الترويسة hex خامّ، والتوقيع على `rawBody` وحده.
 * فالدالّة أدناه تقبل الصيغتين — لا تساهلًا، بل لأنّ الرهان على واحدةٍ يعني
 * رفض كلّ ويب هوك بـ401 **بصمت**، ولا يُكتشف إلّا حين يشكو طالبٌ أنّ مقابلته
 * لم تُسجَّل. كلتاهما تتطلّبان المفتاح السرّي نفسه، فلا فرق أمنيًّا بينهما إلّا
 * في الحماية من إعادة الإرسال (انظر تعليق `verifyPlain`).
 * **متى تأكّدت الصيغة من وثيقةٍ رسميّة، احذف المسار الآخر** وأبقِ الصحيح وحده.
 */

import { prisma } from "@/lib/prisma";

/** مفتاح الإعداد في اللوحة — مُصدَّر ليبقى مصدرًا واحدًا للاسم. */
export const CALENDLY_URL_SETTING_KEY = "admissions.calendlyUrl";

/**
 * رابط صفحة الحجز. ترجع null إن لم يُضبط بعد — وحينها لا تُعرض الأداة أصلًا.
 * لا نتحقّق من كون الرابط تابعًا لـcalendly.com: قد يستعمل العميل نطاقًا مخصَّصًا.
 */
export async function getCalendlyUrl(): Promise<string | null> {
  let fromSetting: string | null = null;
  try {
    const row = await prisma.setting.findUnique({ where: { key: CALENDLY_URL_SETTING_KEY } });
    fromSetting = row?.value == null ? null : String(row.value).trim();
  } catch (e) {
    // إعدادٌ غائبٌ أو قاعدةٌ غير متاحة لا يجوز أن يُسقط صفحةً عامّة.
    console.error("[calendly] تعذّرت قراءة إعداد الرابط:", e);
  }

  const url = fromSetting || (process.env.CALENDLY_SCHEDULING_URL ?? "").trim();
  return url || null;
}

/** هل التكامل مضبوطٌ بما يكفي لتفعيل الويب هوك؟ */
export function isCalendlyWebhookConfigured(): boolean {
  return Boolean(process.env.CALENDLY_WEBHOOK_SIGNING_KEY);
}

// ---------------------------------------------------------------------------
// الويب هوك — التحقّق من التوقيع
// ---------------------------------------------------------------------------

/**
 * الصيغة المركّبة: `Calendly-Webhook-Signature: t=<unix>,v1=<hmac_sha256_hex>`.
 * صارمةٌ عمدًا: أيّ ترويسةٍ تبدأ بـ`t=` ولا تطابق هذا النمط بحرفه تُرفض ولا
 * تسقط إلى الصيغة البسيطة — وإلّا صار المسار البسيط بابًا خلفيًّا يتجاوز فحص
 * الطابع الزمني بمجرّد تشويه الترويسة.
 */
const COMPOUND_RE = /^t=(\d+),v1=([0-9a-f]+)$/i;

/** الصيغة البسيطة: HMAC-SHA256 سداسيّ خامّ — ٦٤ محرفًا لا أقلّ ولا أكثر. */
const PLAIN_RE = /^[0-9a-f]{64}$/i;

/** حدّ عمر الطلب بالثواني — يمنع إعادة إرسال طلبٍ ملتقَط قديم. */
const TOLERANCE_SECONDS = 300;

/**
 * تسجيلٌ تشخيصيّ عند الرفض. سببُ الرفض وحده يوفّر ساعاتٍ على من ينشر النظام:
 * الفرق بين «صيغة ترويسة غير معروفة» و«عدم تطابق» هو الفرق بين خطأ إعدادٍ في
 * Calendly وخطأ مفتاحٍ في متغيّرات البيئة.
 * لا يُطبع المفتاح قطّ، ولا التوقيع كاملًا — بادئةٌ قصيرةٌ تكفي لمطابقة السجلّ
 * بسجلّ التسليم في لوحة Calendly.
 */
function rejectWith(reason: string, header: string | null): false {
  const shape = !header
    ? "غائبة"
    : COMPOUND_RE.test(header)
      ? "مركّبة (t=,v1=)"
      : header.startsWith("t=")
        ? "تشبه المركّبة لكنّها مشوَّهة"
        : PLAIN_RE.test(header)
          ? "بسيطة (hex خامّ)"
          : "غير معروفة";
  const head = header ? `${header.slice(0, 8)}…(طول ${header.length})` : "—";
  console.warn(`[calendly] رُفض الويب هوك: ${reason} | شكل الترويسة: ${shape} | ${head}`);
  return false;
}

/**
 * يتحقّق أنّ الطلب صادر من Calendly فعلًا.
 * **يجب تمرير الجسم الخام** (قبل JSON.parse) وإلا فشل التطابق لاختلاف مسافةٍ واحدة.
 * إن لم يُضبط مفتاح التوقيع رجعت false: مسارٌ مفتوحٌ بلا تحقّق يعني أنّ أيّ أحد
 * يستطيع تزوير مواعيد مقابلاتٍ في طلبات الالتحاق.
 *
 * تُقبل صيغتان (وسببُ ذلك مشروحٌ في رأس الملفّ)، ويُختار المسار **حصرًا** بشكل
 * الترويسة: لا تراجعَ من صيغةٍ إلى أخرى عند الفشل.
 */
export async function verifyCalendlyWebhook(
  rawBody: string,
  signatureHeader: string | null
): Promise<boolean> {
  const key = process.env.CALENDLY_WEBHOOK_SIGNING_KEY;
  if (!key) return rejectWith("CALENDLY_WEBHOOK_SIGNING_KEY غير مضبوط", signatureHeader);
  if (!signatureHeader) return rejectWith("ترويسة التوقيع غائبة", null);

  const header = signatureHeader.trim();
  if (!header) return rejectWith("ترويسة التوقيع فارغة", header);

  const compound = COMPOUND_RE.exec(header);
  if (compound) {
    const [, timestamp, signature] = compound;
    const age = Math.abs(Date.now() / 1000 - Number(timestamp));
    if (!Number.isFinite(age) || age > TOLERANCE_SECONDS) {
      return rejectWith(
        `طابع زمني خارج المدى (فارقٌ ${Math.round(age)}ث، الحدّ ${TOLERANCE_SECONDS}ث)`,
        header
      );
    }
    const ok = await hmacMatches(`${timestamp}.${rawBody}`, signature, key);
    return ok || rejectWith("عدم تطابق التوقيع (الصيغة المركّبة)", header);
  }

  // ترويسةٌ تبدأ بـ`t=` ولم تطابق النمط المركّب: مشوَّهة، وتُرفض هنا قطعًا.
  if (header.startsWith("t=")) return rejectWith("ترويسة مركّبة مشوَّهة", header);

  if (PLAIN_RE.test(header)) {
    // ⚠️ الصيغة البسيطة **لا تحمي من إعادة الإرسال**: لا طابع زمني فيها فلا فحص
    // سماحية. وهي مقبولةٌ هنا لأنّ معالجة الحدث عديمة الأثر (idempotent) —
    // الويب هوك يبحث بـcalendlyEventUri أوّلًا فيُحدِّث السجلّ نفسه مهما تكرّر
    // الطلب. مهاجمٌ يعيد إرسال طلبٍ ملتقَط لا يُحدث إلّا كتابة القيم ذاتها.
    const ok = await hmacMatches(rawBody, header, key);
    return ok || rejectWith("عدم تطابق التوقيع (الصيغة البسيطة)", header);
  }

  return rejectWith("صيغة ترويسة غير معروفة", header);
}

/** مقارنة HMAC-SHA256 بزمنٍ ثابت. */
async function hmacMatches(payload: string, signature: string, key: string): Promise<boolean> {
  const { createHmac, timingSafeEqual } = await import("node:crypto");
  const expected = createHmac("sha256", key).update(payload).digest("hex");

  // المقارنة على النصّ السداسي لا على البايتات: تفاوت الطول وحده يكشفه الشرط
  // الأوّل، وtimingSafeEqual يمنع تسريب التطابق الجزئي عبر زمن المقارنة.
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature.toLowerCase(), "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

// ---------------------------------------------------------------------------
// شكل حمولة الأحداث — ما نحتاجه منها فقط
// ---------------------------------------------------------------------------

export interface CalendlyWebhookBody {
  event?: string;
  payload?: {
    email?: string;
    name?: string;
    /** معرّف المدعوّ نفسه — يتغيّر مع كلّ إعادة جدولة. */
    uri?: string;
    status?: string;
    scheduled_event?: {
      uri?: string;
      name?: string;
      start_time?: string;
      end_time?: string;
      status?: string;
      location?: {
        type?: string;
        /** يعود مع Zoom/Meet/Teams؛ يغيب مع اللقاء الحضوري أو الهاتفي. */
        join_url?: string;
        /** نصّ المكان الحرّ (عنوان أو رقم هاتف) حين لا يكون لقاءً مرئيًّا. */
        location?: string;
      };
    };
  };
}

export interface CalendlyInterview {
  email: string;
  eventUri: string;
  startsAt: Date | null;
  /** رابط اللقاء إن كان مرئيًّا، وإلّا وصف المكان، وإلّا null. */
  joinUrl: string | null;
}

/**
 * يستخرج ما يعني الكلّية من حمولة الحدث.
 * يرجع null إن نقص البريد أو معرّف الحدث — بلا أحدهما لا يمكن ربطُ الموعد بطالب.
 */
export function extractInterview(body: CalendlyWebhookBody): CalendlyInterview | null {
  const p = body.payload;
  const email = (p?.email ?? "").trim().toLowerCase();
  const scheduled = p?.scheduled_event;
  const eventUri = (scheduled?.uri ?? "").trim();
  if (!email || !eventUri) return null;

  const startsAt = scheduled?.start_time ? new Date(scheduled.start_time) : null;
  const loc = scheduled?.location;
  const joinUrl = loc?.join_url?.trim() || loc?.location?.trim() || null;

  return {
    email,
    eventUri,
    startsAt: startsAt && !Number.isNaN(startsAt.getTime()) ? startsAt : null,
    joinUrl,
  };
}
