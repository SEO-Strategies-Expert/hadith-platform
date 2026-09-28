"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireInstructor } from "@/lib/instructor";

export async function updateInstructorCourse(id: string, formData: FormData) {
  const me = await requireInstructor();
  if (!me.scholarId) throw new Error("FORBIDDEN");
  const titleAr = String(formData.get("titleAr") ?? "").trim();
  const titleEn = String(formData.get("titleEn") ?? "").trim();
  const summaryAr = String(formData.get("summaryAr") ?? "").trim();
  if (titleAr.length < 2) throw new Error("عنوان المقرر مطلوب.");
  const result = await prisma.course.updateMany({
    where: { id, OR: [{ instructorId: me.scholarId }, { instructors: { some: { id: me.scholarId } } }] },
    data: { titleAr, titleEn, summaryAr: summaryAr || null },
  });
  if (!result.count) throw new Error("لا يمكنك تعديل هذا المقرر.");
  revalidatePath(`/instructor/courses/${id}`);
  revalidatePath("/instructor/courses");
  redirect(`/instructor/courses/${id}?saved=1`);
}
