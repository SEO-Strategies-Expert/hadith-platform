import type { FieldDef } from "@/lib/resources";

/**
 * حقول الواجب.
 *
 * محلّيّة لا في محرّك الموارد العام — كشاشة المجالس — لأنّ للواجب شاشةً ثانية
 * (التصحيح) لا يعرفها المحرّك، ولأنّ `dueAt` موعدٌ بتاريخ وساعة يُقرأ بتوقيت
 * الكلّية لا بتوقيت الخادم.
 */

export const ASSIGNMENT_STATES = [
  { value: "DRAFT", label: "مسوّدة" },
  { value: "SUBMITTED", label: "مُسلَّم" },
  { value: "RETURNED", label: "أُعيد للتعديل" },
  { value: "GRADED", label: "مُصحَّح" },
];

export function assignmentStateLabel(state: string): string {
  return ASSIGNMENT_STATES.find((s) => s.value === state)?.label ?? state;
}

/** الحالات التي يجوز للمصحِّح أن يضع الواجب فيها. */
export const GRADING_STATES = [
  { value: "GRADED", label: "مُصحَّح (يُعتمد كما هو)" },
  { value: "RETURNED", label: "أُعيد للتعديل (يُتاح للطالب تعديله)" },
];

export const assignmentFields: FieldDef[] = [
  { name: "titleAr", label: "عنوان الواجب (عربي)", type: "text", half: true, required: true },
  { name: "titleEn", label: "عنوان الواجب (إنجليزي)", type: "ltr", half: true, required: true },
  { name: "descAr", label: "نصّ الواجب وتعليماته (عربي)", type: "textarea" },
  { name: "descEn", label: "نصّ الواجب وتعليماته (إنجليزي)", type: "textarea-ltr" },
  {
    name: "courseId",
    label: "المقرّر",
    type: "select",
    required: true,
    relation: { model: "course", labelField: "titleAr" },
    hint: "الواجب لا يُفتح إلّا لطلاب مقرّره المسجَّلين.",
  },
  {
    name: "dueAt",
    label: "الموعد النهائي",
    type: "datetime",
    half: true,
    nullable: true,
    hint: "اتركه فارغًا لواجبٍ بلا موعد. لا يُمنع التسليم بعده — يُعلَّم متأخّرًا وتقرّر الإدارة.",
  },
  { name: "maxScore", label: "الدرجة القصوى", type: "number", half: true },
  { name: "gradingPeriod", label: "فترة الدرجات", type: "text", half: true },
  { name: "rubric", label: "سُلّم التقييم (JSON)", type: "json", hint: "مثال: [{\"criterion\":\"سلامة الاستدلال\",\"points\":40}]" },
  { name: "allowLate", label: "السماح بالتسليم المتأخر", type: "bool", half: true },
  { name: "order", label: "الترتيب", type: "number", half: true },
  { name: "visible", label: "ظاهر للطلاب", type: "bool", half: true },
];
