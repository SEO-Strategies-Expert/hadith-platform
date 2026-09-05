import type { FieldDef } from "@/lib/resources";

/**
 * حقول الاختبارات وأسئلتها.
 *
 * تُعرَّف هنا محلّيًّا ولا تُسجَّل في محرّك الموارد العام — كما فعلت شاشة المجالس —
 * لأنّ حفظ الاختبار ليس حفظًا عاديًّا: الأسئلة تُحرَّر في شاشة متداخلة، وخيارات
 * السؤال تُحذف وتُعاد كتابتها في معاملة واحدة مع تحقّقٍ يمنع اختبارًا لا يُجتاز.
 */

export const QUESTION_KINDS = [
  { value: "SINGLE", label: "اختيار واحد" },
  { value: "MULTI", label: "اختيار متعدّد" },
  { value: "TRUEFALSE", label: "صواب / خطأ" },
  { value: "SHORT", label: "إجابة قصيرة (تصحيح يدوي)" },
];

export function questionKindLabel(kind: string): string {
  return QUESTION_KINDS.find((k) => k.value === kind)?.label ?? kind;
}

/** عدد صفوف الخيارات المعروضة. صفٌّ فارغ يُهمَل عند الحفظ. */
export const CHOICE_SLOTS = 6;

export const quizFields: FieldDef[] = [
  { name: "titleAr", label: "عنوان الاختبار (عربي)", type: "text", half: true, required: true },
  { name: "titleEn", label: "عنوان الاختبار (إنجليزي)", type: "ltr", half: true, required: true },
  { name: "descAr", label: "الوصف والتعليمات (عربي)", type: "textarea" },
  { name: "descEn", label: "الوصف والتعليمات (إنجليزي)", type: "textarea-ltr" },
  {
    name: "courseId",
    label: "المقرّر",
    type: "select",
    relation: { model: "course", labelField: "titleAr", emptyLabel: "— بلا مقرّر (لا يظهر للطلاب) —" },
    hint: "الاختبار لا يُفتح إلّا لطلاب مقرّره المسجَّلين؛ فبلا مقرّر لا يصل إليه أحد.",
  },
  {
    name: "timeLimitMin",
    label: "زمن الاختبار بالدقائق",
    type: "number",
    half: true,
    nullable: true,
    hint: "اتركه فارغًا أو صفرًا لاختبار بلا توقيت. يُحسب على الخادم من لحظة البدء.",
  },
  {
    name: "passScore",
    label: "نسبة النجاح %",
    type: "number",
    half: true,
    hint: "بلوغ النسبة بالضبط نجاحٌ لا رسوب.",
  },
  {
    name: "attemptsAllowed",
    label: "عدد المحاولات المسموحة",
    type: "number",
    half: true,
    hint: "٠ = بلا حدّ.",
  },
  { name: "retakeCooldownHours", label: "الانتظار بين المحاولات (ساعة)", type: "number", half: true },
  { name: "questionPoolSize", label: "عدد أسئلة السحب العشوائي", type: "number", half: true, hint: "0 = استخدام كل الأسئلة. عند تحديده تُسحب عينة لكل محاولة." },
  { name: "availableAt", label: "موعد فتح الاختبار", type: "datetime", half: true, nullable: true },
  { name: "closesAt", label: "موعد إغلاق الاختبار", type: "datetime", half: true, nullable: true },
  { name: "shuffle", label: "خلط ترتيب الأسئلة لكل محاولة", type: "bool", half: true },
  { name: "visible", label: "ظاهر للطلاب", type: "bool" },
];

/** حقول السؤال — الخيارات تُحرَّر بمكوّن مستقلّ أسفل النموذج. */
export const questionFields: FieldDef[] = [
  { name: "kind", label: "نوع السؤال", type: "select", half: true, options: QUESTION_KINDS },
  { name: "points", label: "درجة السؤال", type: "number", half: true },
  { name: "textAr", label: "نصّ السؤال (عربي)", type: "textarea", required: true },
  { name: "textEn", label: "نصّ السؤال (إنجليزي — اختياري)", type: "textarea-ltr" },
  { name: "explainAr", label: "شرح الإجابة بعد التسليم (عربي)", type: "textarea" },
  { name: "explainEn", label: "شرح الإجابة بعد التسليم (إنجليزي)", type: "textarea-ltr" },
  { name: "order", label: "الترتيب", type: "number", half: true },
];
