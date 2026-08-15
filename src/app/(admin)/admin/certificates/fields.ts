import type { FieldDef } from "@/lib/resources";

/**
 * حقول الشهادة/الإجازة.
 *
 * لم تُسجَّل في محرّك الموارد العام لأنّ إصدارها ليس حفظًا عاديًّا: رقم التوثيق
 * ورمز التحقّق يُولَّدان في `lib/certificates.ts` ولا يُدخلان من النموذج قطّ،
 * والوثيقة بعد إصدارها **لا تُحرَّر ولا تُحذف** — تُلغى وتُصدَر أخرى.
 */

export const CERTIFICATE_KINDS = [
  { value: "CERTIFICATE", label: "شهادة إتمام" },
  { value: "IJAZA", label: "إجازة مسنَدة" },
];

export function kindLabel(v: string): string {
  return CERTIFICATE_KINDS.find((k) => k.value === v)?.label ?? v;
}

/** الإجازة المسنَدة أرفع من شهادة الإتمام، فتُميَّز بالذهبيّ في الجداول. */
export function kindTone(v: string): "gold" | "blue" {
  return v === "IJAZA" ? "gold" : "blue";
}

/** حقول تُعرض لكل وثيقة. خيارات «الطالب» تُحقَن في الصفحة. */
export const certificateCoreFields: FieldDef[] = [
  {
    name: "kind",
    label: "نوع الوثيقة",
    type: "select",
    half: true,
    required: true,
    options: CERTIFICATE_KINDS,
    hint: "الإجازة المسنَدة تقتضي ملء السند واسم المُجيز أدناه.",
  },
  {
    name: "userId",
    label: "الطالب",
    type: "select",
    half: true,
    required: true,
    // الخيارات تُملأ من حسابات role = STUDENT وحدها في صفحة الإصدار.
    options: [],
  },
  {
    name: "courseId",
    label: "المقرّر (اختياريّ)",
    type: "select",
    half: true,
    relation: { model: "course", labelField: "titleAr", emptyLabel: "— بلا مقرّر —" },
  },
  {
    name: "stageId",
    label: "المرحلة (اختياريّة)",
    type: "select",
    half: true,
    relation: { model: "programStage", labelField: "titleAr", emptyLabel: "— بلا مرحلة —" },
  },
  { name: "titleAr", label: "عنوان الوثيقة (عربي)", type: "text", required: true },
  { name: "titleEn", label: "عنوان الوثيقة (إنجليزي)", type: "ltr", required: true },
];

/** بيانات الإجازة المسنَدة — تُعرض في صندوقٍ مستقلّ لأنّها لا تخصّ الشهادة. */
export const ijazaFields: FieldDef[] = [
  {
    name: "isnadAr",
    label: "نصّ السند (عربي)",
    type: "textarea",
    hint: "السند المتّصل بالرواية كما يُثبت على الوثيقة.",
  },
  { name: "isnadEn", label: "نصّ السند (إنجليزي)", type: "textarea-ltr" },
  { name: "grantedByAr", label: "اسم المُجيز (عربي)", type: "text", half: true },
  { name: "grantedByEn", label: "اسم المُجيز (إنجليزي)", type: "ltr", half: true },
];
