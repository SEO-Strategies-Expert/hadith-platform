// تعريف صناديق الوارد الثلاثة (نماذج الموقع العام) لعرضها وإدارتها من اللوحة.

export type InboxKind = "contact" | "admissions" | "research";

export interface InboxColumn {
  name: string;
  label: string;
}

export interface InboxField {
  name: string;
  label: string;
  long?: boolean;
  file?: boolean;
}

export interface InboxConfig {
  key: InboxKind;
  model: "contactMessage" | "admissionApplication" | "researchSubmission";
  titleAr: string;
  singularAr: string;
  descAr: string;
  sourcePage: string;
  columns: InboxColumn[];
  fields: InboxField[];
}

export const STATUS_LABELS: Record<string, string> = {
  NEW: "جديد",
  IN_PROGRESS: "قيد المعالجة",
  DONE: "منجز",
  ARCHIVED: "مؤرشف",
};

export const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export const inboxes: Record<InboxKind, InboxConfig> = {
  contact: {
    key: "contact",
    model: "contactMessage",
    titleAr: "رسائل التواصل",
    singularAr: "رسالة",
    descAr: "الرسائل الواردة من نموذج «تواصل معنا».",
    sourcePage: "contact.html",
    columns: [
      { name: "name", label: "المُرسِل" },
      { name: "department", label: "القسم" },
      { name: "email", label: "البريد" },
    ],
    fields: [
      { name: "name", label: "الاسم" },
      { name: "email", label: "البريد الإلكتروني" },
      { name: "department", label: "القسم" },
      { name: "message", label: "الرسالة", long: true },
    ],
  },

  admissions: {
    key: "admissions",
    model: "admissionApplication",
    titleAr: "طلبات الالتحاق",
    singularAr: "طلب",
    descAr: "الطلبات الواردة من نموذج «القبول والتسجيل».",
    sourcePage: "admissions.html",
    columns: [
      { name: "name", label: "مُقدِّم الطلب" },
      { name: "program", label: "البرنامج" },
      { name: "country", label: "الدولة" },
    ],
    fields: [
      { name: "name", label: "الاسم الكامل" },
      { name: "email", label: "البريد الإلكتروني" },
      { name: "phone", label: "رقم الهاتف" },
      { name: "country", label: "الدولة" },
      { name: "program", label: "البرنامج المطلوب" },
      { name: "feeOption", label: "خيار الرسوم" },
      { name: "background", label: "الخلفية العلمية", long: true },
    ],
  },

  research: {
    key: "research",
    model: "researchSubmission",
    titleAr: "الأبحاث المُرسَلة",
    singularAr: "بحث",
    descAr: "الأبحاث الواردة من نموذج «إرسال بحث» مع ملفاتها.",
    sourcePage: "submit-research.html",
    columns: [
      { name: "title", label: "عنوان البحث" },
      { name: "authorName", label: "الباحث" },
      { name: "field", label: "المجال" },
    ],
    fields: [
      { name: "title", label: "عنوان البحث" },
      { name: "authorName", label: "اسم الباحث" },
      { name: "authorEmail", label: "بريد الباحث" },
      { name: "paperType", label: "نوع المادة" },
      { name: "field", label: "المجال" },
      { name: "abstract", label: "الملخّص", long: true },
      { name: "docPath", label: "الملف القابل للتحرير", file: true },
      { name: "pdfPath", label: "نسخة PDF", file: true },
    ],
  },
};

export const FEE_LABELS: Record<string, string> = {
  full: "دفع رسوم كاملة",
  reduced: "رسوم مخفّضة",
  free: "دراسة مجانية",
};

export function getInbox(key: string): InboxConfig | null {
  return inboxes[key as InboxKind] ?? null;
}
