/**
 * إرسال البريد — طبقة رقيقة فوق واجهة Resend عبر HTTP.
 *
 * لا حزمة جديدة عمدًا: `fetch` وحده يكفي، فلا نُثقل التبعيات ولا نُقيّد
 * المشروع بحزمة تتبع مزوّدًا بعينه. تبديل المزوّد لاحقًا يمسّ هذا الملفّ وحده.
 *
 * التصميم — كنموذج `src/lib/zoom.ts` — يعمل **قبل** شراء حساب البريد وبعده:
 *   - بلا `RESEND_API_KEY` → `isMailerConfigured()` ترجع false، فتُطبع الرسالة
 *     في السجلّ بدل إرسالها وتعود النتيجة `{ ok: true, simulated: true }`.
 *     هذا مقصود: نظام التذكيرات يجب أن يعمل ويُختبر قبل توفّر الحساب،
 *     وأن يختم حقول `reminder…SentAt` كأن الإرسال تمّ في بيئة التطوير.
 *   - بالمفتاح → إرسال حقيقي.
 *
 * ⚠️ ملاحظة تشغيليّة: Resend يرفض أي `from` على نطاق غير موثَّق لديه.
 * قبل التشغيل الحيّ يجب توثيق نطاق الكلّية في لوحة Resend (سجلّات DNS)
 * وإلّا رجعت كل محاولة بخطأ 403 مهما صحّ المفتاح.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

/** المرسِل الافتراضي — يُتجاوَز بـ`MAIL_FROM` عند اختلاف النطاق الموثَّق. */
const DEFAULT_FROM = "الكلّية العليا للحديث النبوي <noreply@hadith-faculty.com>";

/** هل مفتاح البريد مضبوط؟ إن لا، يعمل النظام بوضع المحاكاة. */
export function isMailerConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export interface MailInput {
  to: string | string[];
  subject: string;
  html: string;
  /** لتجاوز `MAIL_FROM` في حالات نادرة (بريد قسم بعينه). */
  from?: string;
  /** يُوجَّه إليه الردّ — بريد الكلّية لا صندوق `noreply`. */
  replyTo?: string;
}

export interface MailResult {
  ok: boolean;
  /** true = لم يُرسَل شيء فعليًّا (لا مفتاح) — سُجّل في الطرفيّة فقط. */
  simulated: boolean;
  /** معرّف الرسالة لدى المزوّد عند الإرسال الحقيقي. */
  id?: string;
  error?: string;
}

/**
 * يرسل رسالة واحدة. **لا يرمي استثناءً أبدًا**: التذكيرات تُرسَل في حلقة على
 * عشرات الطلاب، وسقوط الحلقة كلّها لأجل بريد واحد فاشل خسارة لا تُحتمل.
 * الفشل يعود في `{ ok:false, error }` ليحصيه المنادي ويُكمل.
 */
export async function sendMail(input: MailInput): Promise<MailResult> {
  const to = Array.isArray(input.to) ? input.to : [input.to];
  const from = input.from ?? process.env.MAIL_FROM ?? DEFAULT_FROM;

  if (!isMailerConfigured()) {
    console.info(
      `[mailer] وضع المحاكاة (لا RESEND_API_KEY) → إلى: ${to.join(", ")} | الموضوع: ${input.subject}`
    );
    return { ok: true, simulated: true };
  }

  try {
    const res = await postWithRetry({
      from,
      to,
      subject: input.subject,
      html: input.html,
      ...(input.replyTo ? { reply_to: input.replyTo } : {}),
    });

    if (!res.ok) {
      const body = await res.text();
      return { ok: false, simulated: false, error: `Resend ${res.status}: ${body.slice(0, 300)}` };
    }

    const data = (await res.json()) as { id?: string };
    return { ok: true, simulated: false, id: data.id };
  } catch (e) {
    // انقطاع شبكة أو مهلة — نعيدها خطأً لا استثناءً.
    return { ok: false, simulated: false, error: String(e) };
  }
}

/**
 * محاولة واحدة إضافيّة عند 429 أو خطأ خادم.
 * Resend يحدّ الطلبات بمعدّل منخفض افتراضًا (نحو طلبين في الثانية)، وحلقة
 * التذكيرات قد تلامس الحدّ عند دفعة كبيرة؛ إعادة محاولة واحدة بعد مهلة قصيرة
 * تُنقذ الرسالة بدل عدّها فاشلة.
 */
async function postWithRetry(body: Record<string, unknown>): Promise<Response> {
  const send = () =>
    fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

  const first = await send();
  if (first.ok || (first.status !== 429 && first.status < 500)) return first;

  await new Promise((r) => setTimeout(r, 1200));
  return send();
}
