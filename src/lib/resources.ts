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
  // موعد بتاريخ وساعة — يُعرض ويُقرأ بتوقيت الكلّية لا بتوقيت الخادم
  | "datetime"
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
  /**
   * الحقل اختياريّ في المخطّط: فراغه يعني «غير محدَّد» (null) لا صفرًا ولا
   * «اتركه كما هو». بدونها يُحفظ الرقم الفارغ صفرًا، ويتعذّر مسح تاريخ بعد ضبطه.
   */
  nullable?: boolean;
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
      {
        name: "instructorId",
        label: "المحاضر",
        type: "select",
        half: true,
        relation: { model: "scholar", labelField: "nameAr", emptyLabel: "— بلا محاضر —" },
      },
      { name: "category", label: "التصنيف (مفتاح تصفية)", type: "text", half: true, hint: "تخريج / مخطوطات / بحث" },
      { name: "hours", label: "عدد الساعات", type: "number", half: true, nullable: true },
      { name: "summaryAr", label: "نبذة مختصرة (عربي)", type: "textarea", hint: "سطران يظهران في بطاقة المقرّر وبوابة الطالب." },
      { name: "summaryEn", label: "نبذة مختصرة (إنجليزي)", type: "textarea-ltr" },
      { name: "descAr", label: "الوصف (عربي)", type: "textarea" },
      { name: "descEn", label: "الوصف (إنجليزي)", type: "textarea-ltr" },
      ...bilingual("meta", "بيان مختصر (عدد اللقاءات…)"),
      { name: "startsOn", label: "تاريخ البدء", type: "date", half: true, nullable: true },
      { name: "href", label: "رابط الدورة (اختياري)", type: "ltr", half: true },
      { name: "imageUrl", label: "صورة الدورة", type: "image" },
      // «منشور» يخصّ نظام التعلّم، و«ظاهر» يخصّ بطاقة المقرّر في الموقع — حقلان مختلفان عمدًا.
      { name: "published", label: "منشور (مفتوح للتسجيل والدراسة)", type: "bool" },
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

  cards: {
    key: "cards",
    model: "contentCard",
    titleAr: "بطاقات الصفحات",
    singularAr: "بطاقة",
    descAr:
      "شبكات البطاقات في الصفحات الداخلية. اختر القسم لتظهر البطاقة في صفحته.",
    orderBy: { order: "asc" },
    columns: [
      { name: "section", label: "القسم", kind: "badge" },
      { name: "titleAr", label: "العنوان" },
      { name: "tagAr", label: "الوسم", kind: "badge" },
      { name: "visible", label: "ظاهر", kind: "bool" },
    ],
    fields: [
      {
        name: "section",
        label: "القسم في الموقع",
        type: "select",
        half: true,
        required: true,
        options: [
          { value: "programs", label: "البرامج الأكاديمية (programs.html)" },
          { value: "ijazat", label: "الإجازات العلمية (ijazat.html)" },
          { value: "paid-books", label: "الكتب المدفوعة (paid-books.html)" },
          { value: "research", label: "البحث العلمي (research.html)" },
        ],
      },
      { name: "href", label: "وجهة البطاقة", type: "ltr", half: true, hint: "program-foundation.html أو رابط خارجي" },
      ...bilingual("title", "العنوان", { required: true }),
      { name: "descAr", label: "الوصف (عربي)", type: "textarea" },
      { name: "descEn", label: "الوصف (إنجليزي)", type: "textarea-ltr" },
      ...bilingual("tag", "الوسم"),
      ...bilingual("meta", "سطر أسفل البطاقة"),
      { name: "imageUrl", label: "الصورة", type: "image" },
      ...commonTail,
    ],
  },

  faqs: {
    key: "faqs",
    model: "faq",
    titleAr: "الأسئلة الشائعة",
    singularAr: "سؤال",
    descAr: "تظهر في صفحتَي «القبول والتسجيل» و«ضوابط النشر» حسب القسم.",
    orderBy: { order: "asc" },
    columns: [
      { name: "section", label: "القسم", kind: "badge" },
      { name: "questionAr", label: "السؤال" },
      { name: "visible", label: "ظاهر", kind: "bool" },
    ],
    fields: [
      {
        name: "section",
        label: "القسم في الموقع",
        type: "select",
        half: true,
        required: true,
        options: [
          { value: "admissions", label: "القبول والتسجيل (admissions.html)" },
          { value: "publication-rules", label: "ضوابط النشر (publication-rules.html)" },
        ],
      },
      { name: "order", label: "الترتيب", type: "number", half: true },
      ...bilingual("question", "السؤال", { required: true }),
      { name: "answerAr", label: "الإجابة (عربي)", type: "textarea", required: true },
      { name: "answerEn", label: "الإجابة (إنجليزي)", type: "textarea-ltr", required: true },
      { name: "visible", label: "ظاهر في الموقع", type: "bool" },
    ],
  },

  steps: {
    key: "steps",
    model: "processStep",
    titleAr: "خطوات المسارات",
    singularAr: "خطوة",
    descAr: "الخطوط الزمنية: مسار القبول ومسار النشر في المجلة.",
    orderBy: { order: "asc" },
    columns: [
      { name: "section", label: "القسم", kind: "badge" },
      { name: "titleAr", label: "الخطوة" },
      { name: "order", label: "الترتيب" },
      { name: "visible", label: "ظاهر", kind: "bool" },
    ],
    fields: [
      {
        name: "section",
        label: "القسم في الموقع",
        type: "select",
        half: true,
        required: true,
        options: [
          { value: "admissions", label: "مسار القبول (admissions.html)" },
          { value: "publications", label: "مسار النشر (publications.html)" },
        ],
      },
      { name: "order", label: "الترتيب", type: "number", half: true },
      ...bilingual("title", "عنوان الخطوة", { required: true }),
      { name: "descAr", label: "الشرح (عربي)", type: "textarea" },
      { name: "descEn", label: "الشرح (إنجليزي)", type: "textarea-ltr" },
      { name: "visible", label: "ظاهر في الموقع", type: "bool" },
    ],
  },

  "info-rows": {
    key: "info-rows",
    model: "infoRow",
    titleAr: "جدول بيانات الاعتماد",
    singularAr: "بند",
    descAr: "بنود جدول «وثيقة الاعتماد» في صفحة الاعتماد الأكاديمي.",
    orderBy: { order: "asc" },
    columns: [
      { name: "labelAr", label: "البند" },
      { name: "valueAr", label: "القيمة" },
      { name: "visible", label: "ظاهر", kind: "bool" },
    ],
    fields: [
      {
        name: "section",
        label: "القسم في الموقع",
        type: "select",
        half: true,
        required: true,
        options: [{ value: "accreditation", label: "الاعتماد الأكاديمي (accreditation.html)" }],
      },
      { name: "order", label: "الترتيب", type: "number", half: true },
      ...bilingual("label", "اسم البند", { required: true }),
      { name: "valueAr", label: "القيمة (عربي)", type: "textarea" },
      { name: "valueEn", label: "القيمة (إنجليزي)", type: "textarea-ltr" },
      { name: "visible", label: "ظاهر في الموقع", type: "bool" },
    ],
  },

  curriculum: {
    key: "curriculum",
    model: "curriculumRow",
    titleAr: "جدول الخطة الدراسية",
    singularAr: "صفّ",
    descAr: "صفوف جدول المناهج (المرحلة · المحاور · التطبيق · المخرج).",
    siblings: [{ href: "/admin/info-rows", label: "جدول بيانات الاعتماد" }],
    orderBy: { order: "asc" },
    columns: [
      { name: "stageAr", label: "المرحلة" },
      { name: "axesAr", label: "المحاور" },
      { name: "outcomeAr", label: "المخرج" },
      { name: "visible", label: "ظاهر", kind: "bool" },
    ],
    fields: [
      ...bilingual("stage", "المرحلة", { required: true }),
      ...bilingual("axes", "المحاور"),
      ...bilingual("practice", "التطبيق"),
      ...bilingual("outcome", "المخرج"),
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
