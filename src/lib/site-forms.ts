/**
 * تحويل نماذج الموقع من "نماذج عرض" إلى نماذج حقيقية تحفظ في قاعدة البيانات.
 *
 * الحقول في المحتوى المخزَّن معرَّفة بـ id بلا name (كانت واجهةً فقط)، فنُسند
 * لكلٍّ منها اسمًا يفهمه `/api/forms/[kind]`، ونضبط وجهة الإرسال، ونحذف
 * `data-demo-form` كي لا يعترض السكربت الإرسال، ونعرض رسالة النتيجة.
 */
import type { CheerioAPI } from "cheerio";
import type { Lang } from "@/lib/site-data";
import { esc } from "@/lib/site-format";

interface FormSpec {
  kind: "contact" | "admissions" | "research";
  /** id في الترميز → اسم الحقل المرسَل. */
  names: Record<string, string>;
  /** قيَم أزرار الاختيار (radio) حسب id. */
  radioValues?: Record<string, string>;
  multipart?: boolean;
}

const FORMS: Record<string, FormSpec> = {
  contact: {
    kind: "contact",
    names: {
      "contact-name": "name",
      "contact-email": "email",
      department: "department",
      message: "message",
    },
  },
  admissions: {
    kind: "admissions",
    names: {
      name: "name",
      email: "email",
      phone: "phone",
      country: "country",
      program: "program",
      background: "background",
    },
    radioValues: { fullfee: "full", reduced: "reduced", free: "free" },
  },
  "submit-research": {
    kind: "research",
    multipart: true,
    names: {
      author: "authorName",
      "author-email": "authorEmail",
      "paper-title": "title",
      "paper-type": "paperType",
      field: "field",
      abstract: "abstract",
      doc: "doc",
      pdf: "pdf",
    },
  },
};

const MSG = {
  ar: {
    sent: "وصلت رسالتك، وسيتواصل معك القسم المختصّ. شكرًا لك.",
    sentAdmissions: "وصل طلبك بنجاح. سيراجعه قسم القبول ويتواصل معك على بريدك.",
    sentResearch: "وصل بحثك بنجاح. ستصلك نتيجة الفحص الأوّلي على بريدك.",
    error: "تعذّر الإرسال. تأكّد من الحقول المطلوبة وصحّة البريد الإلكتروني ثم أعد المحاولة.",
    size: "حجم الملف أكبر من المسموح (٢٠ ميجابايت للملف الواحد).",
  },
  en: {
    sent: "Your message has been received. The relevant department will get back to you.",
    sentAdmissions: "Your application has been received. Admissions will review it and contact you by email.",
    sentResearch: "Your submission has been received. You will be notified of the initial review by email.",
    error: "Could not submit. Please check the required fields and the email address, then try again.",
    size: "The file exceeds the maximum size (20 MB per file).",
  },
} as const;

/** يبني رسالة النتيجة الظاهرة أعلى النموذج بعد الإرسال. */
function resultBanner(kind: FormSpec["kind"], lang: Lang, sent: boolean, error: string): string {
  const t = MSG[lang];
  if (sent) {
    const body =
      kind === "admissions" ? t.sentAdmissions : kind === "research" ? t.sentResearch : t.sent;
    return (
      `<p class="form-result form-result-ok" role="status" tabindex="-1" ` +
      `style="margin:0 0 16px;padding:14px 16px;border-radius:12px;background:#e7f6ec;` +
      `border:1px solid #b7e2c4;color:#14612f;font-weight:800">${esc(body)}</p>`
    );
  }
  const body = error === "size" ? t.size : t.error;
  return (
    `<p class="form-result form-result-err" role="alert" tabindex="-1" ` +
    `style="margin:0 0 16px;padding:14px 16px;border-radius:12px;background:#fdecec;` +
    `border:1px solid #f3c2c2;color:#8d1f1f;font-weight:800">${esc(body)}</p>`
  );
}

/**
 * يفعّل نموذج الصفحة إن وُجد لها تعريف.
 * @param params معطيات الرابط (sent/error) لعرض رسالة النتيجة.
 * @param path مسار الصفحة الحالي — يُعاد إليه الزائر بعد الإرسال.
 */
export function activateForm(
  $: CheerioAPI,
  slug: string,
  lang: Lang,
  path: string,
  params?: Record<string, string | undefined>
): void {
  const spec = FORMS[slug];
  if (!spec) return;
  const form = $("form[data-demo-form]").first();
  if (form.length === 0) return;

  form.removeAttr("data-demo-form");
  form.attr("method", "post");
  form.attr("action", `/api/forms/${spec.kind}`);
  if (spec.multipart) form.attr("enctype", "multipart/form-data");

  for (const [id, name] of Object.entries(spec.names)) {
    form.find(`#${id}`).attr("name", name);
  }
  for (const [id, value] of Object.entries(spec.radioValues ?? {})) {
    form.find(`#${id}`).attr("value", value);
  }

  form.prepend(
    `<input type="hidden" name="_lang" value="${lang}">` +
      `<input type="hidden" name="_back" value="${esc(path)}">` +
      `<div style="position:absolute;left:-9999px" aria-hidden="true">` +
      `<label>لا تملأ هذا الحقل<input type="text" name="_hp" tabindex="-1" autocomplete="off"></label></div>`
  );

  // رسالة العرض القديمة ("النموذج جاهز بصريًّا…") لم تعد صحيحة.
  form.find("[data-form-message]").remove();

  const sent = params?.sent === "1";
  const error = params?.error;
  if (sent || error) {
    form.before(resultBanner(spec.kind, lang, sent, error ?? ""));
  }
}
