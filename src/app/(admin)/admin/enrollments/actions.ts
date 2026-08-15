"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";

/**
 * إجراءات تسجيل الطلاب في المقرّرات.
 * سجلّ التسجيل هو ما يفتح محتوى المقرّر للطالب فعلًا، فالتحقّق هنا أشدّ:
 * لا نسجّل إلا حسابًا دوره STUDENT، ولا نكرّر تسجيلًا قائمًا.
 */

const STATUSES = ["PENDING", "ACTIVE", "COMPLETED", "CANCELLED"] as const;

const createSchema = z.object({
  userId: z.string().trim().min(1, "اختر الطالب"),
  courseId: z.string().trim().min(1, "اختر المقرّر"),
  status: z.enum(STATUSES).default("ACTIVE"),
  feeOption: z.string().optional(),
});

const updateSchema = z.object({
  status: z.enum(STATUSES),
  feeOption: z.string().optional(),
  progressPct: z.coerce.number().int().min(0).max(100).default(0),
});

export async function createEnrollment(
  _prev: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  await requireUser();
  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return parsed.error.issues[0].message;

  const student = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { role: true },
  });
  if (!student || student.role !== "STUDENT") return "الحساب المختار ليس حساب طالب.";

  const course = await prisma.course.findUnique({
    where: { id: parsed.data.courseId },
    select: { id: true },
  });
  if (!course) return "المقرّر غير موجود.";

  const existing = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: parsed.data.userId, courseId: parsed.data.courseId } },
    select: { id: true },
  });
  if (existing) return "هذا الطالب مسجَّل في هذا المقرّر بالفعل.";

  const status = parsed.data.status;
  await prisma.enrollment.create({
    data: {
      userId: parsed.data.userId,
      courseId: parsed.data.courseId,
      status,
      feeOption: parsed.data.feeOption || "free",
      completedAt: status === "COMPLETED" ? new Date() : null,
    },
  });

  revalidatePath("/admin/enrollments");
  redirect("/admin/enrollments");
}

export async function updateEnrollment(
  id: string,
  _prev: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  await requireUser();
  const parsed = updateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return parsed.error.issues[0].message;

  const current = await prisma.enrollment.findUnique({
    where: { id },
    select: { completedAt: true },
  });
  if (!current) return "سجلّ التسجيل غير موجود.";

  const status = parsed.data.status;
  await prisma.enrollment.update({
    where: { id },
    data: {
      status,
      feeOption: parsed.data.feeOption || "free",
      progressPct: parsed.data.progressPct,
      // تاريخ الإنجاز يتبع الحالة: يُختم عند الإنجاز ويُمحى عند التراجع عنه.
      completedAt: status === "COMPLETED" ? current.completedAt ?? new Date() : null,
    },
  });

  revalidatePath("/admin/enrollments");
  redirect("/admin/enrollments");
}

export async function deleteEnrollment(id: string) {
  await requireUser();
  await prisma.enrollment.delete({ where: { id } });
  revalidatePath("/admin/enrollments");
}
