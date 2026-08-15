"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/guard";
import { isEnrolled, setLessonDone } from "@/lib/lms";

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
