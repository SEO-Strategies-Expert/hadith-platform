import type { FieldDef } from "@/lib/resources";

/**
 * تعريفات حقول الوحدات والدروس.
 *
 * الوحدات والدروس لا تُدار عبر محرّك الموارد العام لأنّ كلًّا منها ابنٌ لسجلّ
 * أعلى (مقرّر ← وحدة ← درس)، والمحرّك العام لا يعرف الأب فيعرضها مسطَّحةً بلا
 * سياق. لكنّنا نُبقي **شكل الحقول** واحدًا (`FieldDef`) لتُصيَّر بنفس مكوّن
 * `ResourceFields` فتتطابق الشاشات بصريًّا مع بقيّة اللوحة.
 */

export const LESSON_KINDS = [
  { value: "VIDEO", label: "درس مرئي" },
  { value: "PDF", label: "ملفّ للقراءة" },
  { value: "TEXT", label: "متن مكتوب" },
  { value: "LIVE", label: "مجلس مباشر" },
  { value: "QUIZ", label: "اختبار" },
] as const;

export const moduleFields: FieldDef[] = [
  { name: "titleAr", label: "عنوان الوحدة (عربي)", type: "text", half: true, required: true },
  { name: "titleEn", label: "عنوان الوحدة (إنجليزي)", type: "ltr", half: true, required: true },
  { name: "descAr", label: "وصف الوحدة (عربي)", type: "textarea" },
  { name: "descEn", label: "وصف الوحدة (إنجليزي)", type: "textarea-ltr" },
  { name: "order", label: "الترتيب", type: "number", half: true, hint: "الأصغر أوّلًا." },
  { name: "visible", label: "ظاهرة للطلاب", type: "bool" },
];

export const lessonFields: FieldDef[] = [
  { name: "titleAr", label: "عنوان الدرس (عربي)", type: "text", half: true, required: true },
  { name: "titleEn", label: "عنوان الدرس (إنجليزي)", type: "ltr", half: true, required: true },
  {
    name: "kind",
    label: "نوع الدرس",
    type: "select",
    half: true,
    options: LESSON_KINDS.map((k) => ({ value: k.value, label: k.label })),
  },
  { name: "durationMin", label: "المدّة بالدقائق", type: "number", half: true },
  {
    name: "videoUrl",
    label: "رابط المادّة (فيديو أو ملفّ)",
    type: "ltr",
    hint: "رابط يوتيوب/فيميو غير مُدرَج، أو رابط ملفّ PDF.",
  },
  { name: "bodyAr", label: "المتن (عربي)", type: "textarea", hint: "يُستعمل مع نوع «متن مكتوب»." },
  { name: "bodyEn", label: "المتن (إنجليزي)", type: "textarea-ltr" },
  { name: "transcriptAr", label: "النص المفرّغ / الترجمة (عربي)", type: "textarea", hint: "يتيح البحث والوصول لذوي الاحتياجات ويساعد الطالب على المراجعة." },
  { name: "transcriptEn", label: "النص المفرّغ / الترجمة (إنجليزي)", type: "textarea-ltr" },
  { name: "unlockAt", label: "فتح الدرس في موعد محدد", type: "datetime", half: true, nullable: true },
  { name: "dripDays", label: "يفتح بعد التسجيل بـ (أيام)", type: "number", half: true, hint: "0 = متاح مباشرة، ما لم يوجد موعد فتح." },
  { name: "prerequisiteLessonId", label: "درس سابق مطلوب", type: "select", half: true, nullable: true, relation: { model: "lesson", labelField: "titleAr", emptyLabel: "— لا يوجد —" } },
  { name: "thumbnailUrl", label: "صورة مصغّرة", type: "image" },
  { name: "downloadable", label: "السماح بتنزيل المورد", type: "bool", half: true },
  { name: "order", label: "الترتيب داخل الوحدة", type: "number", half: true, hint: "الأصغر أوّلًا." },
  { name: "freePreview", label: "معاينة مجّانيّة (تُفتح لغير المسجَّلين)", type: "bool" },
  { name: "visible", label: "ظاهر للطلاب", type: "bool" },
];
