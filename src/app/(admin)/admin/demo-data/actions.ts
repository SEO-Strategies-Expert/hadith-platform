"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/guard";
import { prisma } from "@/lib/prisma";

const STUDENT_EMAIL = "demo@hadith-faculty.com";
const INSTRUCTOR_EMAIL = "sheikh@hadith-faculty.com";
const COURSE_SLUG = "demo-feature-workflow";

async function findOrCreateSession(input: {
  courseId: string; instructorId: string; titleAr: string; titleEn: string;
  startsAt: Date; durationMin: number; joinUrl: string; zoomStartUrl: string;
}) {
  const endsAt = new Date(input.startsAt.getTime() + input.durationMin * 60_000);
  const existing = await prisma.liveSession.findFirst({ where: { courseId: input.courseId, titleAr: input.titleAr } });
  const data = {
    titleAr: input.titleAr, titleEn: input.titleEn,
    descAr: "بيانات عرض تجريبية لاختبار جدول الطالب والمعلم وروابط Zoom والحضور.",
    descEn: "Demo data for testing student and instructor schedules, Zoom links, and attendance.",
    courseId: input.courseId, instructorId: input.instructorId,
    startsAt: input.startsAt, endsAt, durationMin: input.durationMin,
    provider: "zoom", joinUrl: input.joinUrl, zoomStartUrl: input.zoomStartUrl,
    visible: true, isPublic: false,
  };
  return existing
    ? prisma.liveSession.update({ where: { id: existing.id }, data })
    : prisma.liveSession.create({ data });
}

export async function seedDemoFeatureData(_prev: string | undefined, _formData: FormData): Promise<string | undefined> {
  await requireAdmin();
  const [student, instructor] = await Promise.all([
    prisma.user.findUnique({ where: { email: STUDENT_EMAIL } }),
    prisma.user.findUnique({ where: { email: INSTRUCTOR_EMAIL } }),
  ]);
  if (!student || student.role !== "STUDENT") return `حساب الطالب التجريبي ${STUDENT_EMAIL} غير موجود؛ جهّز حسابات العرض أولًا.`;
  if (!instructor || instructor.role !== "INSTRUCTOR" || !instructor.scholarId) return `حساب المعلم التجريبي ${INSTRUCTOR_EMAIL} غير موجود أو غير مرتبط بملف هيئة علمية.`;

  const now = new Date();
  const activeTeacherScholar = await prisma.scholar.findUnique({ where: { id: instructor.scholarId } });
  if (!activeTeacherScholar) return "ملف المعلم التجريبي المرتبط بالحساب غير موجود.";

  await prisma.user.update({
    where: { id: student.id },
    data: {
      studentNo: student.studentNo?.trim() || "DEMO-2026-001",
      avatarUrl: student.avatarUrl || "/assets/img/scholar-5.jpg",
      program: student.program || "تخصص علوم الحديث",
      country: student.country || "سوريا",
    },
  });

  const course = await prisma.course.upsert({
    where: { slug: COURSE_SLUG },
    create: {
      slug: COURSE_SLUG,
      titleAr: "مقرر تجريبي: مصطلح الحديث",
      titleEn: "Demo course: Hadith terminology",
      descAr: "مقرر تجريبي لعرض أدوات الطالب والمعلم والجدول والواجبات والدرجات.",
      descEn: "Demo course for student and instructor tools, timetable, assignments, and grades.",
      summaryAr: "يتضمن هذا المقرر درسًا وملفًا ومجلسًا مباشرًا وواجبًا واختبارًا تجريبيًا.",
      summaryEn: "Includes a lesson, material, live session, assignment, and a sample quiz.",
      instructorId: activeTeacherScholar.id,
      instructors: { connect: { id: activeTeacherScholar.id } },
      published: true, visible: true, allowSelfEnrollment: true, hours: 12,
      imageUrl: "/assets/img/card-diwan.jpg", order: 999,
    },
    update: {
      instructorId: activeTeacherScholar.id,
      instructors: { connect: { id: activeTeacherScholar.id } },
      published: true, visible: true,
    },
  });

  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: student.id, courseId: course.id } },
    create: { userId: student.id, courseId: course.id, status: "ACTIVE", feeOption: "free" },
    update: { status: "ACTIVE" },
  });

  let module = await prisma.module.findFirst({ where: { courseId: course.id, titleAr: "وحدة العرض: أصول المصطلح" } });
  if (!module) module = await prisma.module.create({ data: { courseId: course.id, titleAr: "وحدة العرض: أصول المصطلح", titleEn: "Demo unit: terminology foundations", order: 0, visible: true } });
  let lesson = await prisma.lesson.findFirst({ where: { moduleId: module.id, titleAr: "درس تجريبي: شروط الحديث الصحيح" } });
  if (!lesson) lesson = await prisma.lesson.create({
    data: {
      moduleId: module.id, titleAr: "درس تجريبي: شروط الحديث الصحيح", titleEn: "Demo lesson: Conditions of an authentic hadith",
      kind: "TEXT", order: 0, durationMin: 30, visible: true, freePreview: true,
      bodyAr: "<p>عرض تجريبي لمحتوى الدرس: اتصال السند وعدالة الرواة وضبطهم وانتفاء الشذوذ والعلّة.</p>",
    },
  });
  const attachment = await prisma.lessonAttachment.findFirst({ where: { lessonId: lesson.id, titleAr: "ملف تجريبي للمقرر" } });
  if (!attachment) await prisma.lessonAttachment.create({ data: { lessonId: lesson.id, titleAr: "ملف تجريبي للمقرر", titleEn: "Sample course material", url: "/assets/img/certificate-frame.png", order: 0 } });

  const past = await findOrCreateSession({
    courseId: course.id, instructorId: activeTeacherScholar.id,
    titleAr: "محاضرة تجريبية سابقة: مصطلح الحديث", titleEn: "Demo past lecture: Hadith terminology",
    startsAt: new Date(now.getTime() - 2 * 86_400_000), durationMin: 60,
    joinUrl: "https://zoom.us/j/00000000000", zoomStartUrl: "https://zoom.us/s/00000000000?role=host",
  });
  const absent = await findOrCreateSession({
    courseId: course.id, instructorId: activeTeacherScholar.id,
    titleAr: "محاضرة تجريبية: سجل الغياب", titleEn: "Demo lecture: absence example",
    startsAt: new Date(now.getTime() - 86_400_000), durationMin: 45,
    joinUrl: "https://zoom.us/j/00000000000", zoomStartUrl: "https://zoom.us/s/00000000000?role=host",
  });
  const upcoming = await findOrCreateSession({
    courseId: course.id, instructorId: activeTeacherScholar.id,
    titleAr: "محاضرة تجريبية قادمة: تطبيقات الإسناد", titleEn: "Upcoming demo lecture: chain analysis",
    startsAt: new Date(now.getTime() + 2 * 86_400_000), durationMin: 75,
    joinUrl: "https://zoom.us/j/00000000000", zoomStartUrl: "https://zoom.us/s/00000000000?role=host",
  });

  const pastStart = past.startsAt;
  const pastEnd = new Date(pastStart.getTime() + past.durationMin * 60_000);
  await prisma.attendance.upsert({
    where: { userId_sessionId: { userId: student.id, sessionId: past.id } },
    create: { userId: student.id, sessionId: past.id, joinedAt: pastStart, leftAt: pastEnd, minutes: 55, present: true, source: "demo", note: "سجل حضور تجريبي" },
    update: { joinedAt: pastStart, leftAt: pastEnd, minutes: 55, present: true, source: "demo", note: "سجل حضور تجريبي" },
  });
  await prisma.attendance.upsert({
    where: { userId_sessionId: { userId: instructor.id, sessionId: past.id } },
    create: { userId: instructor.id, sessionId: past.id, joinedAt: pastStart, leftAt: pastEnd, minutes: 55, present: true, source: "instructor-self", note: "حضور معلم تجريبي" },
    update: { joinedAt: pastStart, leftAt: pastEnd, minutes: 55, present: true, source: "instructor-self", note: "حضور معلم تجريبي" },
  });
  await prisma.attendance.upsert({
    where: { userId_sessionId: { userId: student.id, sessionId: absent.id } },
    create: { userId: student.id, sessionId: absent.id, joinedAt: absent.startsAt, minutes: 0, present: false, source: "demo", note: "سجل غياب تجريبي" },
    update: { joinedAt: absent.startsAt, leftAt: null, minutes: 0, present: false, source: "demo", note: "سجل غياب تجريبي" },
  });

  const assignmentTitle = "واجب تجريبي: تخريج حديث ودراسة إسناده";
  let assignment = await prisma.assignment.findFirst({ where: { courseId: course.id, titleAr: assignmentTitle } });
  if (!assignment) assignment = await prisma.assignment.create({
    data: { courseId: course.id, titleAr: assignmentTitle, titleEn: "Demo assignment: source and analyze a hadith", descAr: "اكتب تخريجًا مختصرًا لحديث واذكر مصادره وحكمًا موجزًا على إسناده.", dueAt: new Date(now.getTime() + 7 * 86_400_000), maxScore: 100, visible: true, order: 0 },
  });
  await prisma.assignmentSubmission.upsert({
    where: { assignmentId_userId: { assignmentId: assignment.id, userId: student.id } },
    create: { assignmentId: assignment.id, userId: student.id, text: "إجابة تجريبية: ذُكر الحديث في مصادره، وإسناده متصل ورجاله ثقات.", state: "GRADED", submittedAt: pastStart, score: 88, feedback: "إجابة جيدة؛ أضف مقارنة بين طرق الحديث في المراجعة القادمة.", gradedById: instructor.id, gradedAt: now },
    update: { text: "إجابة تجريبية: ذُكر الحديث في مصادره، وإسناده متصل ورجاله ثقات.", state: "GRADED", submittedAt: pastStart, score: 88, feedback: "إجابة جيدة؛ أضف مقارنة بين طرق الحديث في المراجعة القادمة.", gradedById: instructor.id, gradedAt: now },
  });

  let quiz = await prisma.quiz.findFirst({ where: { courseId: course.id, titleAr: "اختبار تجريبي: شروط الحديث الصحيح" } });
  if (!quiz) quiz = await prisma.quiz.create({ data: { courseId: course.id, titleAr: "اختبار تجريبي: شروط الحديث الصحيح", titleEn: "Demo quiz: authentic hadith conditions", descAr: "اختبار قصير لعرض أدوات المقرر.", passScore: 60, timeLimitMin: 10, visible: true, availableAt: new Date(now.getTime() - 86_400_000) } });
  let question = await prisma.question.findFirst({ where: { quizId: quiz.id, order: 0 } });
  if (!question) question = await prisma.question.create({ data: { quizId: quiz.id, kind: "SINGLE", textAr: "أيّ مما يلي من شروط الحديث الصحيح؟", textEn: "Which is a condition of an authentic hadith?", explainAr: "من شروطه اتصال السند وعدالة الرواة وضبطهم وانتفاء الشذوذ والعلّة.", points: 1, order: 0 } });
  let correctChoiceId: string | null = null;
  for (const [order, choice] of [[0, "اتصال السند"], [1, "كثرة المتون فقط"]] as const) {
    const existing = await prisma.choice.findFirst({ where: { questionId: question.id, order } });
    const saved = existing ?? await prisma.choice.create({ data: { questionId: question.id, textAr: choice, textEn: choice, correct: order === 0, order } });
    if (order === 0) correctChoiceId = saved.id;
  }

  const quizAttempt = await prisma.quizAttempt.findFirst({ where: { quizId: quiz.id, userId: student.id } });
  const quizAttemptData = {
    startedAt: pastStart,
    submittedAt: pastEnd,
    answers: { [question.id]: correctChoiceId ? [correctChoiceId] : [] },
    questionIds: [question.id],
    score: 100,
    passed: true,
  };
  if (quizAttempt) await prisma.quizAttempt.update({ where: { id: quizAttempt.id }, data: quizAttemptData });
  else await prisma.quizAttempt.create({ data: { ...quizAttemptData, quizId: quiz.id, userId: student.id } });

  const noticeHref = `/admin/sessions/${past.id}`;
  const admins = await prisma.user.findMany({ where: { role: "ADMIN", status: "ACTIVE" }, select: { id: true } });
  for (const admin of admins) {
    const existing = await prisma.notification.findFirst({ where: { userId: admin.id, kind: "instructor-attendance", href: noticeHref } });
    if (!existing) await prisma.notification.create({
      data: { userId: admin.id, kind: "instructor-attendance", titleAr: "حضور معلم (بيانات تجريبية)", titleEn: "Instructor attendance (demo data)", bodyAr: "سجّل المعلم التجريبي حضوره للمحاضرة، وتم حفظ مدة الدوام.", bodyEn: "The demo instructor checked into a lecture and the attendance duration was recorded.", href: noticeHref },
    });
  }

  revalidatePath("/admin/demo-data");
  revalidatePath("/student");
  revalidatePath("/student/id-card");
  revalidatePath("/student/attendance");
  revalidatePath("/student/assignments");
  revalidatePath("/student/grades");
  revalidatePath("/instructor");
  revalidatePath("/instructor/attendance");
  revalidatePath("/instructor/sessions");
  revalidatePath("/instructor/grades");
  revalidatePath("/admin/sessions");
  revalidatePath("/admin/notifications");
  redirect("/admin/demo-data?seeded=1");
}
