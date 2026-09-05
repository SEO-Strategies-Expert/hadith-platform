"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/guard";
import { isEnrolled, recomputeProgress, setLessonDone } from "@/lib/lms";
import { issueCertificate } from "@/lib/certificates";
import { redirect } from "next/navigation";

/**
 * تعليم الدرس منجَزًا/غير منجَز من زرّ داخل نموذج (يعمل بلا JavaScript).
 *
 * لماذا نُعيد التحقّق هنا رغم التحقّق في الصفحة؟ لأنّ الـserver action نقطةُ
 * دخولٍ شبكيّةٌ مستقلّة يمكن استدعاؤها مباشرةً بأي معرّف درس؛ فلو اتّكلنا على
 * فحص الصفحة لأمكن لأي مستخدم مسجَّل الدخول أن يكتب تقدّمًا في مقرّر لا يدرسه.
 * وحارس `src/proxy.ts` لا يغطّي مسارات البوابة الفرعيّة أصلًا.
 */
export async function toggleLessonDone(lessonId: string, done: boolean, _formData?: FormData) {
  const user = await currentUser();
  if (!user?.id) return;

  // نقرأ المقرّر من الدرس نفسه لا من مُدخَل الطالب — فلا يمكن تزوير الانتماء.
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      visible: true,
      module: { select: { visible: true, courseId: true } },
    },
  });
  if (!lesson || !lesson.visible || !lesson.module.visible) return;

  // التقدّم يُسجَّل للمسجَّلين فقط؛ معاينة `freePreview` قراءةٌ بلا تقدّم.
  if (!(await isEnrolled(user.id, lesson.module.courseId))) return;

  await setLessonDone(user.id, lessonId, done);

  // اللغتان تشتركان في البيانات، فنُبطل الذاكرة لكليهما دفعةً واحدة.
  const courseId = lesson.module.courseId;
  for (const prefix of ["/student", "/en/student"]) {
    revalidatePath(prefix);
    revalidatePath(`${prefix}/course/${courseId}`);
    revalidatePath(`${prefix}/lesson/${lessonId}`);
  }
}

/**
 * يصدر شهادة المقرر عند طلب الطالب لها بعد الإكمال.
 * هذا مسار احتياطي مقصود للمقررات التي لم يكن فيها الإصدار التلقائي مفعّلًا؛
 * ولا يكرر الشهادة إن كانت موجودة بالفعل.
 */
export async function claimCourseCertificate(courseId: string, lang: "ar" | "en", _formData?: FormData) {
  const user = await currentUser();
  if (!user?.id || !(await isEnrolled(user.id, courseId))) return;

  await recomputeProgress(user.id, courseId);
  const [enrollment, course, existing] = await Promise.all([
    prisma.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId } }, select: { status: true } }),
    prisma.course.findUnique({ where: { id: courseId }, select: { titleAr: true, titleEn: true } }),
    prisma.certificate.findFirst({ where: { userId: user.id, courseId, revoked: false }, select: { id: true } }),
  ]);
  if (!course || enrollment?.status !== "COMPLETED") return;

  if (!existing) await issueCertificate({
    kind: "CERTIFICATE",
    userId: user.id,
    courseId,
    titleAr: `شهادة إتمام ${course.titleAr}`,
    titleEn: `Certificate of completion: ${course.titleEn}`,
  });

  revalidatePath("/student/certificates");
  revalidatePath("/en/student/certificates");
  redirect(lang === "en" ? "/en/student/certificates" : "/student/certificates");
}

async function canUseLesson(userId: string, lessonId: string) {
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, select: { module: { select: { courseId: true } } } });
  return lesson && await isEnrolled(userId, lesson.module.courseId) ? lesson : null;
}

export async function saveStudentNote(lessonId: string, formData: FormData) {
  const user = await currentUser();
  if (!user?.id || !(await canUseLesson(user.id, lessonId))) return;
  const body = String(formData.get("body") ?? "").trim().slice(0, 10000);
  if (body) await prisma.studentNote.create({ data: { userId: user.id, lessonId, body } });
  revalidatePath(`/student/lesson/${lessonId}`);
  revalidatePath(`/en/student/lesson/${lessonId}`);
}

export async function deleteStudentNote(noteId: string, lessonId: string) {
  const user = await currentUser();
  if (!user?.id) return;
  await prisma.studentNote.deleteMany({ where: { id: noteId, userId: user.id, lessonId } });
  revalidatePath(`/student/lesson/${lessonId}`);
  revalidatePath(`/en/student/lesson/${lessonId}`);
}

export async function toggleBookmark(lessonId: string) {
  const user = await currentUser();
  if (!user?.id || !(await canUseLesson(user.id, lessonId))) return;
  const existing = await prisma.bookmark.findUnique({ where: { userId_lessonId: { userId: user.id, lessonId } } });
  if (existing) await prisma.bookmark.delete({ where: { id: existing.id } });
  else await prisma.bookmark.create({ data: { userId: user.id, lessonId } });
  revalidatePath(`/student/lesson/${lessonId}`);
  revalidatePath(`/en/student/lesson/${lessonId}`);
}

export async function sendCourseMessage(courseId: string, formData: FormData) {
  const user = await currentUser();
  if (!user?.id || !(await isEnrolled(user.id, courseId))) return;
  const body = String(formData.get("body") ?? "").trim().slice(0, 5000);
  const subject = String(formData.get("subject") ?? "").trim().slice(0, 200) || null;
  if (body) await prisma.courseMessage.create({ data: { courseId, senderId: user.id, subject, body } });
  revalidatePath(`/student/course/${courseId}`); revalidatePath(`/en/student/course/${courseId}`); revalidatePath("/admin/communications");
}

export async function createForumTopic(courseId: string, formData: FormData) {
  const user = await currentUser();
  if (!user?.id || !(await isEnrolled(user.id, courseId))) return;
  const title = String(formData.get("title") ?? "").trim().slice(0, 200);
  const body = String(formData.get("body") ?? "").trim().slice(0, 10000);
  if (title && body) await prisma.forumTopic.create({ data: { userId: user.id, courseId, title, body } });
  revalidatePath(`/student/course/${courseId}`); revalidatePath(`/en/student/course/${courseId}`); revalidatePath("/admin/communications");
}
