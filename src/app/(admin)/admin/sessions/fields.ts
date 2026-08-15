import type { FieldDef } from "@/lib/resources";

/**
 * حقول المجلس المباشر.
 *
 * لم نضعه في محرّك الموارد العام لأنّ حفظه ليس حفظًا عاديًّا: قد يستدعي Zoom
 * لإنشاء المجلس، وفيه حقول سرّية (رابط المضيف) وحقول للقراءة فقط (أوقات
 * التذكير) يملؤها نظامٌ آخر.
 */

export const SESSION_PROVIDERS = [
  { value: "zoom", label: "زووم" },
  { value: "meet", label: "جوجل ميت" },
  { value: "youtube", label: "بثّ يوتيوب" },
  { value: "other", label: "أخرى" },
];

export const sessionFields: FieldDef[] = [
  { name: "titleAr", label: "عنوان المجلس (عربي)", type: "text", half: true, required: true },
  { name: "titleEn", label: "عنوان المجلس (إنجليزي)", type: "ltr", half: true, required: true },
  { name: "descAr", label: "الوصف (عربي)", type: "textarea" },
  { name: "descEn", label: "الوصف (إنجليزي)", type: "textarea-ltr" },
  {
    name: "courseId",
    label: "المقرّر",
    type: "select",
    half: true,
    relation: { model: "course", labelField: "titleAr", emptyLabel: "— بلا مقرّر —" },
  },
  {
    name: "stageId",
    label: "المرحلة",
    type: "select",
    half: true,
    relation: { model: "programStage", labelField: "titleAr", emptyLabel: "— بلا مرحلة —" },
  },
  {
    name: "instructorId",
    label: "المحاضر",
    type: "select",
    half: true,
    relation: { model: "scholar", labelField: "nameAr", emptyLabel: "— بلا محاضر —" },
  },
  {
    name: "provider",
    label: "منصّة البثّ",
    type: "select",
    half: true,
    options: SESSION_PROVIDERS,
  },
  { name: "startsAt", label: "موعد البداية", type: "datetime", half: true, required: true },
  { name: "durationMin", label: "المدّة بالدقائق", type: "number", half: true },
  { name: "joinUrl", label: "رابط انضمام الطلاب", type: "ltr", hint: "يُملأ تلقائيًّا عند إنشاء مجلس Zoom." },
  { name: "passcode", label: "رمز الدخول", type: "ltr", half: true },
  { name: "recordingUrl", label: "رابط التسجيل (بعد المجلس)", type: "ltr", half: true },
  { name: "isPublic", label: "مجلس عامّ (يظهر في تقويم الموقع بلا تسجيل دخول)", type: "bool" },
  { name: "visible", label: "ظاهر", type: "bool" },
];
