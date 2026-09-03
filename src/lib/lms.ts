/**
 * نواة نظام التعلّم — استعلامات مشتركة بين بوابة الطالب واللوحة والموقع العام.
 *
 * كل ما هنا **قراءة على الخادم فقط** عدا الدوال المعلَّمة بـ(كتابة).
 * الغرض أن تُكتب قواعد الوصول والتقدّم في موضع واحد لا في كل صفحة.
 */
import { prisma } from "@/lib/prisma";
import type { Lang } from "@/lib/site-data";
import { issueCertificate } from "@/lib/certificates";

/** الحالات التي تُعتبر «مقرّرًا يدرسه الطالب فعلًا». */
export const ACTIVE_ENROLLMENT = ["ACTIVE", "COMPLETED"] as const;

// ---------------------------------------------------------------------------
// التسجيل والوصول
// ---------------------------------------------------------------------------

/** مقرّرات الطالب مع مرحلتها ومحاضرها ونسبة تقدّمه. */
export async function getStudentCourses(userId: string) {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
    orderBy: { enrolledAt: "desc" },
    include: {
      course: { include: { stage: true, instructor: true } },
    },
  });
  return enrollments;
}

/**
 * هل يملك المستخدم حقّ دخول المقرّر؟
 * الطالب يحتاج تسجيلًا فعّالًا، بينما يملك المدير والمحرّر وصول معاينة كاملًا
 * كي يختبرا تجربة الطالب من صفحات المقرّر نفسها بلا إنشاء تسجيلات وهميّة.
 * الدروس المعلَّمة `freePreview` تُفحص على حدة في صفحة الدرس.
 */
export async function isEnrolled(userId: string, courseId: string): Promise<boolean> {
  const [user, e] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { role: true } }),
    prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      select: { status: true },
    }),
  ]);
  if (user?.role === "ADMIN" || user?.role === "EDITOR") return true;
  return Boolean(e && (ACTIVE_ENROLLMENT as readonly string[]).includes(e.status));
}

/** تسجيل طالب في مقرّر (كتابة). آمن للتكرار — يعيد السجلّ القائم إن وُجد. */
export async function enroll(userId: string, courseId: string, feeOption = "free") {
  return prisma.enrollment.upsert({
    where: { userId_courseId: { userId, courseId } },
    create: { userId, courseId, feeOption, status: "PENDING" },
    update: {},
  });
}

// ---------------------------------------------------------------------------
// بنية المقرّر
// ---------------------------------------------------------------------------

/** المقرّر بوحداته ودروسه المرئيّة مرتَّبة، مع مرفقات كل درس. */
export async function getCourseTree(courseId: string) {
  return prisma.course.findUnique({
    where: { id: courseId },
    include: {
      stage: true,
      instructor: true,
      modules: {
        where: { visible: true },
        orderBy: { order: "asc" },
        include: {
          lessons: {
            where: { visible: true },
            orderBy: { order: "asc" },
            include: { attachments: { orderBy: { order: "asc" } } },
          },
        },
      },
    },
  });
}

export type CourseTree = NonNullable<Awaited<ReturnType<typeof getCourseTree>>>;

/** كل دروس المقرّر مسطَّحةً بترتيب العرض — للتنقّل «السابق/التالي». */
export function flattenLessons(course: CourseTree) {
  return course.modules.flatMap((m) =>
    m.lessons.map((l) => ({ ...l, moduleTitleAr: m.titleAr, moduleTitleEn: m.titleEn }))
  );
}

// ---------------------------------------------------------------------------
// التقدّم
// ---------------------------------------------------------------------------

/** خريطة تقدّم الطالب في مقرّر: معرّف الدرس → أُنجز؟ */
export async function getProgressMap(
  userId: string,
  lessonIds: string[]
): Promise<Map<string, boolean>> {
  if (!lessonIds.length) return new Map();
  const rows = await prisma.lessonProgress.findMany({
    where: { userId, lessonId: { in: lessonIds } },
    select: { lessonId: true, completed: true },
  });
  return new Map(rows.map((r) => [r.lessonId, r.completed]));
}

/**
 * يعلّم درسًا منجَزًا أو غير منجَز (كتابة)، ثم يعيد حساب نسبة تقدّم المقرّر
 * ويحدّثها في سجلّ التسجيل — فتبقى النسبة صحيحة دائمًا بلا مهامّ خلفيّة.
 */
export async function setLessonDone(userId: string, lessonId: string, done: boolean) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { module: { select: { courseId: true } } },
  });
  if (!lesson) throw new Error("LESSON_NOT_FOUND");
  const courseId = lesson.module.courseId;

  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    create: { userId, lessonId, completed: done },
    update: { completed: done },
  });

  await recomputeProgress(userId, courseId);
  return courseId;
}

/** يعيد حساب نسبة التقدّم من الدروس المرئيّة فقط (كتابة). */
export async function recomputeProgress(userId: string, courseId: string): Promise<number> {
  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { titleAr: true, titleEn: true, completionPercent: true, minimumQuizScore: true, autoCertificate: true } });
  if (!course) throw new Error("COURSE_NOT_FOUND");
  const lessons = await prisma.lesson.findMany({
    where: { visible: true, module: { courseId, visible: true } },
    select: { id: true },
  });
  const total = lessons.length;

  const doneCount = total
    ? await prisma.lessonProgress.count({
        where: { userId, completed: true, lessonId: { in: lessons.map((l) => l.id) } },
      })
    : 0;

  const pct = total ? Math.round((doneCount / total) * 100) : 0;

  const quizAverage = await prisma.quizAttempt.aggregate({ where: { userId, submittedAt: { not: null }, score: { not: null }, quiz: { courseId } }, _avg: { score: true } });
  const meetsQuiz = course.minimumQuizScore == null || (quizAverage._avg.score ?? 0) >= course.minimumQuizScore;
  const completed = pct >= course.completionPercent && meetsQuiz;
  await prisma.enrollment.updateMany({
    where: { userId, courseId },
    data: {
      progressPct: pct,
      ...(completed ? { status: "COMPLETED", completedAt: new Date() } : {}),
    },
  });
  if (completed && course.autoCertificate) {
    const exists = await prisma.certificate.findFirst({ where: { userId, courseId, revoked: false }, select: { id: true } });
    if (!exists) await issueCertificate({ kind: "CERTIFICATE", userId, courseId, titleAr: `شهادة إتمام ${course.titleAr}`, titleEn: `Certificate of completion: ${course.titleEn}` });
  }
  return pct;
}

// ---------------------------------------------------------------------------
// المجالس المباشرة
// ---------------------------------------------------------------------------

/** نافذة اعتبار المجلس «مباشرًا الآن»: من ١٥ دقيقة قبله حتى نهايته. */
export const LIVE_LEAD_MIN = 15;

export function isLiveNow(session: { startsAt: Date; endsAt: Date | null; durationMin: number }) {
  const now = Date.now();
  const start = session.startsAt.getTime() - LIVE_LEAD_MIN * 60_000;
  const end = (
    session.endsAt ?? new Date(session.startsAt.getTime() + session.durationMin * 60_000)
  ).getTime();
  return now >= start && now <= end;
}

/**
 * مجالس الطالب القادمة: ما ارتبط بمقرّراته أو بمرحلته، إضافةً للمجالس العامّة.
 */
export async function getUpcomingSessions(userId: string, take = 8) {
  const [enrollments, stages] = await Promise.all([
    prisma.enrollment.findMany({ where: { userId }, select: { courseId: true } }),
    prisma.stageEnrollment.findMany({ where: { userId }, select: { stageId: true } }),
  ]);

  return prisma.liveSession.findMany({
    where: {
      visible: true,
      startsAt: { gte: new Date(Date.now() - 60 * 60_000) }, // يبقى ساعةً بعد بدايته
      OR: [
        { courseId: { in: enrollments.map((e) => e.courseId) } },
        { stageId: { in: stages.map((s) => s.stageId) } },
        { isPublic: true },
      ],
    },
    orderBy: { startsAt: "asc" },
    take,
    include: { course: true, instructor: true },
  });
}

/** المجالس العامّة القادمة — لتقويم الموقع بلا تسجيل دخول. */
export async function getPublicSessions(take = 20) {
  return prisma.liveSession.findMany({
    where: { visible: true, isPublic: true, startsAt: { gte: new Date(Date.now() - 60 * 60_000) } },
    orderBy: { startsAt: "asc" },
    take,
    include: { course: true, instructor: true },
  });
}

// ---------------------------------------------------------------------------
// أدوات عرض
// ---------------------------------------------------------------------------

/** عنوان مترجَم من حقلين Ar/En مع سقوط آمن للعربي. */
export function title(lang: Lang, ar: string | null, en: string | null): string {
  return (lang === "en" ? en || ar : ar || en) ?? "";
}

/** وقت المجلس بصيغة مقروءة قصيرة (٢٠:٣٠). */
export function timeLabel(d: Date, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "ar-QA", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: process.env.ZOOM_TIMEZONE ?? "Asia/Qatar",
  }).format(d);
}
