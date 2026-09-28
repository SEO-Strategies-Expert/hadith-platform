"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireInstructor } from "@/lib/instructor";

export async function addInstructorModule(courseId: string, formData: FormData) {
  const me = await requireInstructor();
  if (!me.scholarId) throw new Error("FORBIDDEN");
  const titleAr = String(formData.get("titleAr") ?? "").trim();
  const titleEn = String(formData.get("titleEn") ?? "").trim();
  if (!titleAr || !titleEn) throw new Error("عنوان الوحدة بالعربية والإنجليزية مطلوب.");
  const course = await prisma.course.findFirst({ where: { id: courseId, OR: [{ instructorId: me.scholarId }, { instructors: { some: { id: me.scholarId } } }] }, select: { id: true } });
  if (!course) throw new Error("لا يمكنك تعديل هذا المقرر.");
  const last = await prisma.module.findFirst({ where: { courseId }, orderBy: { order: "desc" }, select: { order: true } });
  await prisma.module.create({ data: { courseId, titleAr, titleEn, order: (last?.order ?? -1) + 1, visible: true } });
  revalidatePath(`/instructor/courses/${courseId}`);
}
