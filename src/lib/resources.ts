// محرّك موارد عام للـ CRUD — يعرّف حقول كل مورد وأعمدة قائمته.
export type FieldType =
  | "text"
  | "ltr"
  | "textarea"
  | "textarea-ltr"
  | "number"
  | "bool"
  | "select"
  | "date"
  | "image";

export interface FieldDef {
  name: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  options?: { value: string; label: string }[];
  /** قائمة اختيار تُملأ من جدول آخر (مثل ربط المقرّر بمرحلته). */
  relation?: { model: string; labelField: string; emptyLabel?: string };
  hint?: string;
  half?: boolean; // نصف عرض في الشبكة
}

export interface ColumnDef {
  name: string;
  label: string;
  kind?: "text" | "bool" | "image" | "badge";
}

export interface ResourceConfig {
  key: string; // مسار المورد
  model: string; // اسم موديل Prisma (camelCase)
  titleAr: string;
  singularAr: string;
  descAr?: string;
  fields: FieldDef[];
  columns: ColumnDef[];
  orderBy?: Record<string, "asc" | "desc">;
  siblings?: { href: string; label: string }[];
}

const bilingual = (base: string, labelAr: string, opts: Partial<FieldDef> = {}): FieldDef[] => [
  { name: base + "Ar", label: `${labelAr} (عربي)`, type: "text", half: true, ...opts },
  { name: base + "En", label: `${labelAr} (إنجليزي)`, type: "ltr", half: true, ...opts },
];

const commonTail: FieldDef[] = [
  { name: "order", label: "الترتيب", type: "number", half: true },
  { name: "visible", label: "ظاهر في الموقع", type: "bool" },
];

export const resources: Record<string, ResourceConfig> = {
  news: {
    key: "news",
    model: "newsItem",
    titleAr: "الأخبار والفعاليات",
    singularAr: "خبر",
    descAr: "إدارة أخبار الكلّية وفعالياتها.",
    siblings: [{ href: "/admin/events", label: "الفعاليات" }],
    orderBy: { date: "desc" },
    columns: [
      { name: "titleAr", label: "العنوان" },
      { name: "tagAr", label: "التصنيف", kind: "badge" },
      { name: "featured", label: "رئيس", kind: "bool" },
      { name: "visible", label: "ظاهر", kind: "bool" },
    ],
    fields: [
      ...bilingual("title", "العنوان", { required: true }),
      ...bilingual("tag", "التصنيف"),
      { name: "excerptAr", label: "الملخّص (عربي)", type: "textarea" },
      { name: "excerptEn", label: "الملخّص (إنجليزي)", type: "textarea-ltr" },
      { name: "bodyAr", label: "التفاصيل (عربي)", type: "textarea" },
      { name: "bodyEn", label: "التفاصيل (إنجليزي)", type: "textarea-ltr" },
      { name: "imageUrl", label: "رابط الصورة", type: "image", half: true },
      { name: "date", label: "التاريخ", type: "date", half: true },
      { name: "featured", label: "خبر رئيس (مميّز)", type: "bool" },
      ...commonTail,
    ],
  },

  events: {
    key: "events",
    model: "event",
    titleAr: "الفعاليات القادمة",
    singularAr: "فعالية",
    orderBy: { date: "asc" },
    columns: [
      { name: "titleAr", label: "الفعالية" },
      { name: "whenAr", label: "التوقيت" },
      { name: "visible", label: "ظاهر", kind: "bool" },
    ],
    fields: [
      ...bilingual("title", "العنوان", { required: true }),
      ...bilingual("desc", "الوصف"),
      ...bilingual("when", "التوقيت"),
      ...bilingual("tag", "الوسم"),
      { name: "date", label: "التاريخ", type: "date", half: true, required: true },
      { name: "href", label: "رابط الفعالية (اختياري)", type: "ltr", half: true, hint: "diwan.html أو رابط بثّ خارجي" },
      { name: "imageUrl", label: "صورة الفعالية", type: "image" },
      ...commonTail,
    ],
  },

  library: {
    key: "library",
    model: "libraryResource",
    titleAr: "المكتبة والمصادر",
    singularAr: "مصدر",
    descAr: "المواقع والمصادر الحديثية البحثية.",
    orderBy: { order: "asc" },
    columns: [
      { name: "nameAr", label: "المصدر" },
      { name: "category", label: "التصنيف", kind: "badge" },
      { name: "featured", label: "مميّز", kind: "bool" },
      { name: "active", label: "مفعّل", kind: "bool" },
    ],
    fields: [
      ...bilingual("name", "الاسم", { required: true }),
      { name: "url", label: "الرابط", type: "ltr", half: true },
      { name: "category", label: "التصنيف", type: "text", half: true },
      { name: "descAr", label: "الوصف (عربي)", type: "textarea" },
      { name: "descEn", label: "الوصف (إنجليزي)", type: "textarea-ltr" },
      { name: "icon", label: "رمز مختصر (حرفان)", type: "text", half: true },
      { name: "order", label: "الترتيب", type: "number", half: true },
      { name: "featured", label: "مميّز", type: "bool" },
      { name: "active", label: "مفعّل", type: "bool" },
    ],
  },

  papers: {
    key: "papers",
    model: "paper",
    titleAr: "الأبحاث المحكّمة",
    singularAr: "بحث",
    orderBy: { order: "asc" },
    columns: [
      { name: "no", label: "#" },
      { name: "titleAr", label: "عنوان البحث" },
      { name: "visible", label: "ظاهر", kind: "bool" },
    ],
    fields: [
      { name: "no", label: "الرقم", type: "text", half: true },
      { name: "fileUrl", label: "رابط الملف", type: "ltr", half: true },
      ...bilingual("title", "العنوان", { required: true }),
      ...bilingual("meta", "بيانات (مؤلّف · محكّم · صفحات)"),
      ...bilingual("tag", "المجال (رواية/دراية/تحقيق…)"),
      { name: "imageUrl", label: "صورة البحث", type: "image" },
      ...commonTail,
    ],
  },

  issues: {
    key: "issues",
    model: "journalIssue",
    titleAr: "أعداد المجلة",
    singularAr: "عدد",
    orderBy: { order: "asc" },
    columns: [
      { name: "noAr", label: "العدد" },
      { name: "dateAr", label: "التاريخ" },
      { name: "isNew", label: "جديد", kind: "bool" },
    ],
    fields: [
      ...bilingual("name", "اسم المجلة", { required: true }),
      ...bilingual("sub", "العنوان الفرعي"),
      ...bilingual("no", "رقم العدد"),
      ...bilingual("date", "التاريخ"),
      ...bilingual("tag", "الوسم"),
      { name: "coverUrl", label: "رابط الغلاف", type: "image", half: true },
      { name: "href", label: "رابط العدد (اختياري)", type: "ltr", half: true, hint: "published-research.html أو ملف PDF" },
      { name: "isNew", label: "صدر حديثًا", type: "bool" },
      ...commonTail,
    ],
  },

  threads: {
    key: "threads",
    model: "diwanThread",
    titleAr: "مجالس الديوان",
    singularAr: "مجلس",
    descAr: "مجالس المذاكرة العلمية.",
    siblings: [{ href: "/admin/categories", label: "تصنيفات الديوان" }],
    orderBy: { order: "asc" },
    columns: [
      { name: "titleAr", label: "المجلس" },
      { name: "authorAr", label: "صاحبه" },
      { name: "count", label: "مشاركات" },
      { name: "pinned", label: "مثبّت", kind: "bool" },
    ],
    fields: [
      ...bilingual("title", "العنوان", { required: true }),
      ...bilingual("author", "صاحب المجلس", { required: true }),
      ...bilingual("rank", "الصفة"),
      ...bilingual("time", "التوقيت"),
      { name: "count", label: "عدد المشاركات", type: "number", half: true },
      { name: "pinned", label: "مثبّت", type: "bool" },
      ...commonTail,
    ],
  },

  courses: {
    key: "courses",
    model: "course",
    titleAr: "المقرّرات الدراسية",
    singularAr: "مقرّر",
    descAr:
      "مقرّرات المراحل الدراسية. المقرّر المرتبط بمرحلة يخدم خطّة المرحلة، والمقرّر بلا مرحلة يظهر بطاقةً في صفحة «الدورات العلمية».",
    siblings: [{ href: "/admin/programs", label: "مراحل البرنامج" }],
    orderBy: { order: "asc" },
    columns: [
      { name: "titleAr", label: "المقرّر" },
      { name: "category", label: "التصنيف", kind: "badge" },
      { name: "visible", label: "ظاهر", kind: "bool" },
    ],
    fields: [
      ...bilingual("title", "اسم المقرّر", { required: true }),
      {
        name: "stageId",
        label: "المرحلة",
        type: "select",
        half: true,
        relation: { model: "programStage", labelField: "titleAr", emptyLabel: "— بلا مرحلة —" },
      },
      { name: "category", label: "التصنيف (مفتاح تصفية)", type: "text", half: true, hint: "تخريج / مخطوطات / بحث" },
      { name: "descAr", label: "الوصف (عربي)", type: "textarea" },
      { name: "descEn", label: "الوصف (إنجليزي)", type: "textarea-ltr" },
      ...bilingual("meta", "بيان مختصر (عدد اللقاءات…)"),
      { name: "href", label: "رابط الدورة (اختياري)", type: "ltr", half: true },
      { name: "imageUrl", label: "صورة الدورة", type: "image", half: true },
      ...commonTail,
    ],
  },

  categories: {
    key: "categories",
    model: "diwanCategory",
    titleAr: "تصنيفات الديوان",
    singularAr: "تصنيف",
    orderBy: { order: "asc" },
    columns: [
      { name: "labelAr", label: "التصنيف" },
      { name: "key", label: "المفتاح" },
    ],
    fields: [
      { name: "key", label: "المفتاح (إنجليزي فريد)", type: "ltr", half: true, required: true },
      { name: "order", label: "الترتيب", type: "number", half: true },
      ...bilingual("label", "الاسم", { required: true }),
    ],
  },

  social: {
    key: "social",
    model: "socialLink",
    titleAr: "روابط التواصل",
    singularAr: "منصّة",
    orderBy: { order: "asc" },
    columns: [
      { name: "labelAr", label: "المنصّة" },
      { name: "url", label: "الرابط", kind: "text" },
      { name: "visible", label: "ظاهر", kind: "bool" },
    ],
    fields: [
      { name: "key", label: "المفتاح", type: "ltr", half: true, required: true, hint: "youtube, x, instagram…" },
      { name: "icon", label: "الأيقونة", type: "ltr", half: true, hint: "s-yt, s-fb…" },
      ...bilingual("label", "الاسم", { required: true }),
      { name: "url", label: "الرابط", type: "ltr" },
      ...commonTail,
    ],
  },

  nav: {
    key: "nav",
    model: "navLink",
    titleAr: "روابط التنقّل",
    singularAr: "رابط",
    descAr: "روابط الهيدر والفوتر. (روابط الهيدر ذات الأب تُدار كقوائم منسدلة.)",
    orderBy: { order: "asc" },
    columns: [
      { name: "labelAr", label: "الرابط" },
      { name: "menu", label: "الموضع", kind: "badge" },
      { name: "href", label: "الوجهة" },
      { name: "visible", label: "ظاهر", kind: "bool" },
    ],
    fields: [
      {
        name: "menu",
        label: "الموضع",
        type: "select",
        half: true,
        options: [
          { value: "HEADER", label: "الهيدر" },
          { value: "FOOTER", label: "الفوتر" },
          { value: "TOPBAR", label: "الشريط العلوي" },
        ],
      },
      { name: "href", label: "الوجهة (رابط)", type: "ltr", half: true, required: true },
      ...bilingual("label", "الاسم", { required: true }),
      { name: "icon", label: "الأيقونة (اختياري)", type: "ltr", half: true, hint: "i-college…" },
      { name: "group", label: "المجموعة (عمود الفوتر)", type: "ltr", half: true, hint: "col1 / col2 / col3" },
      ...commonTail,
    ],
  },

  slides: {
    key: "slides",
    model: "heroSlide",
    titleAr: "شرائح الهيرو",
    singularAr: "شريحة",
    descAr: "صور واجهة الصفحة الرئيسية (عربي/إنجليزي).",
    orderBy: { order: "asc" },
    columns: [
      { name: "imageAr", label: "الصورة (عربي)", kind: "image" },
      { name: "imageEn", label: "الصورة (إنجليزي)", kind: "image" },
      { name: "visible", label: "ظاهر", kind: "bool" },
    ],
    fields: [
      { name: "imageAr", label: "صورة الشريحة (عربي)", type: "image", required: true },
      { name: "imageEn", label: "صورة الشريحة (إنجليزي)", type: "image", required: true },
      { name: "altAr", label: "الوصف البديل (عربي)", type: "text" },
      { name: "altEn", label: "الوصف البديل (إنجليزي)", type: "textarea-ltr" },
      ...commonTail,
    ],
  },
};

export function getResource(key: string): ResourceConfig | null {
  return resources[key] ?? null;
}
