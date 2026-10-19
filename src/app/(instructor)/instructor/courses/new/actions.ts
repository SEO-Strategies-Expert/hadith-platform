"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireInstructor } from "@/lib/instructor";
import { courseSlugFor } from "@/lib/course-slug";

/**
 * المحاضر ينشئ مقرّرًا جديدًا باسمه. يُحفظ **غير منشور** حتى يراجعه الأدمن
 * وينشره، ويصل إشعار لكل أدمن. `instructorId` يؤخذ من الحساب لا من النموذج.
 */
export async function createInstructorCourse(_prev: string | undefined, form: FormData): Promise<string | undefined> {
  const me = await requireInstructor();
  if (!me.scholarId) return "حسابك غير مربوط بملف عضو هيئة تدريس بعد؛ تواصل مع الإدارة.";

  const text = (k: string) => String(form.get(k) ?? "").trim();
  const titleAr = text("titleAr");
  const titleEn = text("titleEn") || titleAr;
  if (titleAr.length < 2) return "عنوان المقرّر بالعربية مطلوب.";
  const hoursRaw = Number(text("hours"));
  const hours = Number.isFinite(hoursRaw) && hoursRaw > 0 ? Math.round(hoursRaw) : null;
  const stageId = text("stageId") || null;
  if (stageId && !(await prisma.programStage.findUnique({ where: { id: stageId }, select: { id: true } }))) return "المرحلة غير موجودة.";
  const imageUrl = text("imageUrl");
  if (imageUrl && !/^https?:\/\//i.test(imageUrl) && !imageUrl.startsWith("/")) return "رابط الصورة غير صالح.";

  const course = await prisma.course.create({
    data: {
      titleAr,
      titleEn,
      summaryAr: text("summaryAr") || null,
      descAr: text("descAr") || null,
      hours,
      stageId,
      imageUrl: imageUrl || null,
      slug: await courseSlugFor(titleAr, titleEn),
      instructorId: me.scholarId,
      published: false,
      visible: true,
    },
    select: { id: true },
  });

  const admins = await prisma.user.findMany({ where: { role: "ADMIN", status: "ACTIVE" }, select: { id: true } });
  if (admins.length) {
    await prisma.notification.createMany({
      data: admins.map((a) => ({
        userId: a.id,
        kind: "instructor-course",
        titleAr: "مقرّر جديد بانتظار المراجعة",
        titleEn: "New course awaiting review",
        bodyAr: `${me.scholarName ?? me.name} أنشأ مقرّر «${titleAr}». راجعه ثم انشره.`,
        bodyEn: `${me.name} created the course "${titleEn}".`,
        href: `/admin/courses/${course.id}`,
      })),
    });
  }

  revalidatePath("/instructor/courses");
  revalidatePath("/admin/courses");
  revalidatePath("/admin/notifications");
  redirect(`/instructor/courses/${course.id}/manage`);
}
