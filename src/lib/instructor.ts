/**
 * نواة لوحة الأكاديميين — الحارس والاستعلامات المعزولة.
 *
 * لماذا ملفّ مستقلّ لا استعلامات متفرّقة في الصفحات؟ لأنّ العزل بين المحاضرين
 * شرطٌ أمنيّ لا تجميليّ: لو تُرك لكل صفحة أن تكتب استعلامها بنفسها لأفلَت شرط
 * الملكيّة من موضعٍ ما يومًا. فكل قراءة هنا تأخذ `scholarId` **معاملًا أوّلَ
 * إلزاميًّا** وتضعه داخل `where` نفسه — لا تصفيةً بعد الجلب، ولا اعتمادًا على
 * معرّفٍ آتٍ من الرابط.
 *
 * ⚠️ نقطة محوريّة: `Course.instructorId` و`LiveSession.instructorId` يشيران إلى
 * `Scholar` لا إلى `User`. فمفتاح التصفية هو `user.scholarId` (ملفّ عضو الهيئة)
 * وليس `user.id`. الخلط بينهما يفتح لوحة محاضرٍ على مقرّرات غيره.
 */
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/guard";
import { isLiveNow } from "@/lib/lms";

/** المستخدم كما تعيده أدوات هذه اللوحة — الدور و`scholarId` من القاعدة لا من الجلسة. */
export type InstructorUser = {
  id: string;
  name: string;
  email: string;
  role: "INSTRUCTOR" | "ADMIN";
  /** ملفّ عضو الهيئة المرتبط بالحساب. `null` = لم تربطه الإدارة بعد. */
  scholarId: string | null;
  scholarName: string | null;
};

/**
 * حارس لوحة الأكاديميين.
 *
 * يقبل `INSTRUCTOR`، ويقبل `ADMIN` كذلك ليتفقّد المدير اللوحة كما يراها المحاضر.
 * ويرمي `FORBIDDEN` لغيرهما (المحرّر والطالب).
 *
 * الدور يُقرأ من القاعدة لا من رمز الجلسة: الجلسة قد تكون سابقةً لترقية الحساب
 * إلى `INSTRUCTOR`، كما أنّ `scholarId` أصلًا ليس في الجلسة، وهو مفتاح كل عزل
 * بعد ذلك — فقراءتهما معًا من مصدر واحد أضمن.
 */
export async function requireInstructor(): Promise<InstructorUser> {
  const session = await currentUser();
  if (!session?.id) throw new Error("UNAUTHENTICATED");

  const me = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      scholarId: true,
      scholar: { select: { nameAr: true } },
    },
  });

  if (!me || me.status !== "ACTIVE") throw new Error("FORBIDDEN");
  if (me.role !== "INSTRUCTOR" && me.role !== "ADMIN") throw new Error("FORBIDDEN");

  return {
    id: me.id,
    name: me.name,
    email: me.email,
    role: me.role,
    scholarId: me.scholarId,
    scholarName: me.scholar?.nameAr ?? null,
  };
}

// ---------------------------------------------------------------------------
// المقرّرات
// ---------------------------------------------------------------------------

/** مقرّرات المحاضر وحده — التصفية بـ`instructorId` داخل الاستعلام. */
export async function getInstructorCourses(scholarId: string) {
  return prisma.course.findMany({
    where: { instructorId: scholarId },
    orderBy: [{ order: "asc" }, { titleAr: "asc" }],
    include: {
      stage: { select: { titleAr: true } },
      _count: { select: { enrollments: true, modules: true, sessions: true } },
    },
  });
}

/**
 * مقرّر بعينه **إن كان للمحاضر**. `findFirst` بشرطين مجتمعين لا `findUnique`
 * ثم مقارنة: معرّف المقرّر يأتي من الرابط، فلا يُوثَق به وحده أبدًا.
 * تعيد `null` لمقرّر غير موجود أو ليس له — والصفحة تُظهر 404 في الحالتين
 * حتى لا يكون وجود المقرّر نفسه معلومةً تتسرّب.
 */
export async function getInstructorCourse(scholarId: string, courseId: string) {
  return prisma.course.findFirst({
    where: { id: courseId, instructorId: scholarId },
    include: {
      stage: { select: { titleAr: true } },
      modules: {
        orderBy: [{ order: "asc" }, { titleAr: "asc" }],
        include: {
          lessons: {
            orderBy: [{ order: "asc" }, { titleAr: "asc" }],
            include: { _count: { select: { attachments: true } } },
          },
        },
      },
    },
  });
}

/** طلاب مقرّرٍ للمحاضر — شرط الملكيّة مضمَّن في `course` داخل `where`. */
export async function getCourseStudents(scholarId: string, courseId: string) {
  return prisma.enrollment.findMany({
    where: { courseId, course: { instructorId: scholarId } },
    orderBy: [{ status: "asc" }, { enrolledAt: "desc" }],
    include: { user: { select: { id: true, name: true, email: true, studentNo: true } } },
  });
}

// ---------------------------------------------------------------------------
// المجالس
// ---------------------------------------------------------------------------

/** المجلس يبقى «قادمًا» ساعةً بعد بدايته حتى لا يختفي من أمام المحاضر أثناء انعقاده. */
const PAST_GRACE_MS = 60 * 60_000;

/**
 * مجالس المحاضر مقسومةً قادمة/منتهية، وكل صفٍّ معلَّم بـ«مباشر الآن؟».
 *
 * قراءة الساعة تتمّ هنا لا في جسم المكوّن: `Date.now()` أثر جانبيّ يجعل نتيجة
 * الرسم غير مستقرّة، وقاعدة `react-hooks/purity` تمنعه في المكوّنات.
 */
export async function getInstructorSessions(scholarId: string) {
  const sessions = await prisma.liveSession.findMany({
    where: { instructorId: scholarId },
    orderBy: { startsAt: "asc" },
    include: {
      course: { select: { id: true, titleAr: true } },
      stage: { select: { titleAr: true } },
      _count: { select: { attendance: true } },
    },
  });

  const rows = sessions.map((s) => ({ ...s, live: isLiveNow(s) }));
  const cutoff = Date.now() - PAST_GRACE_MS;
  return {
    upcoming: rows.filter((s) => s.startsAt.getTime() >= cutoff),
    past: rows.filter((s) => s.startsAt.getTime() < cutoff).reverse(),
  };
}

/**
 * مجلس بعينه **إن كان للمحاضر** — نفس منطق `getInstructorCourse`.
 * تعيد معه حالتَي «مباشر الآن» و«انتهى» لنفس سبب سابقه: الساعة تُقرأ خارج الرسم.
 */
export async function getInstructorSession(scholarId: string, sessionId: string) {
  const session = await prisma.liveSession.findFirst({
    where: { id: sessionId, instructorId: scholarId },
    include: {
      course: { select: { id: true, titleAr: true } },
      stage: { select: { titleAr: true } },
      attendance: {
        orderBy: { joinedAt: "asc" },
        include: { user: { select: { id: true, name: true, email: true, studentNo: true } } },
      },
    },
  });
  if (!session) return null;

  return {
    ...session,
    live: isLiveNow(session),
    ended: session.startsAt.getTime() < Date.now() - PAST_GRACE_MS,
  };
}

/** المجلس القادم الأقرب — لبطاقة الصفحة الرئيسة. */
export async function getNextSession(scholarId: string) {
  return prisma.liveSession.findFirst({
    where: { instructorId: scholarId, startsAt: { gte: new Date(Date.now() - 60 * 60_000) } },
    orderBy: { startsAt: "asc" },
    include: { course: { select: { titleAr: true } } },
  });
}

// ---------------------------------------------------------------------------
// الطلاب
// ---------------------------------------------------------------------------

/**
 * كل تسجيلات طلاب مقرّرات المحاضر.
 * الشرط `course.instructorId` هو ما يمنع ظهور طالب في مقرّرٍ ليس له — الطالب
 * نفسه قد يكون مسجَّلًا عند محاضرٍ آخر، ولا يظهر منه هنا إلّا صفّ مقرّره.
 */
export async function getInstructorStudents(scholarId: string) {
  return prisma.enrollment.findMany({
    where: { course: { instructorId: scholarId } },
    orderBy: [{ enrolledAt: "desc" }],
    include: {
      user: { select: { id: true, name: true, email: true, studentNo: true, country: true } },
      course: { select: { id: true, titleAr: true } },
    },
  });
}

// ---------------------------------------------------------------------------
// لوحة المؤشّرات
// ---------------------------------------------------------------------------

export async function getInstructorOverview(scholarId: string) {
  const [coursesCount, studentRows, pendingGrading, nextSession] = await Promise.all([
    prisma.course.count({ where: { instructorId: scholarId } }),
    // `distinct` لأنّ الطالب الواحد قد يسجّل في أكثر من مقرّرٍ للمحاضر نفسه،
    // فيُحسب مرّةً لا مرّتين.
    prisma.enrollment.findMany({
      where: { course: { instructorId: scholarId } },
      select: { userId: true },
      distinct: ["userId"],
    }),
    prisma.assignmentSubmission.count({
      where: { state: "SUBMITTED", assignment: { course: { instructorId: scholarId } } },
    }),
    getNextSession(scholarId),
  ]);

  return {
    coursesCount,
    studentsCount: studentRows.length,
    pendingGrading,
    nextSession,
  };
}

// ---------------------------------------------------------------------------
// تسميات عربيّة للعرض
// ---------------------------------------------------------------------------

export const ENROLLMENT_LABEL: Record<string, string> = {
  PENDING: "بانتظار الاعتماد",
  ACTIVE: "مُفعَّل",
  COMPLETED: "مُنجَز",
  CANCELLED: "ملغى",
};

export function enrollmentTone(status: string): "gray" | "green" | "blue" | "red" {
  if (status === "ACTIVE") return "green";
  if (status === "COMPLETED") return "blue";
  if (status === "CANCELLED") return "red";
  return "gray";
}

export const LESSON_KIND_LABEL: Record<string, string> = {
  VIDEO: "درس مرئي",
  PDF: "ملفّ للقراءة",
  TEXT: "متن مكتوب",
  LIVE: "مجلس مباشر",
  QUIZ: "اختبار",
};
