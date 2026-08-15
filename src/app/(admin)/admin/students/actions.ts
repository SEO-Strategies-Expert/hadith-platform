"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";

const base = {
  name: z.string().min(2, "الاسم قصير جدًّا"),
  email: z.string().email("بريد غير صحيح"),
  status: z.enum(["ACTIVE", "DISABLED"]),
  studentNo: z.string().optional(),
  phone: z.string().optional(),
  country: z.string().optional(),
  program: z.string().optional(),
};

const optional = (v?: string) => (v && v.trim() !== "" ? v.trim() : null);

export async function createStudent(
  _prev: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  await requireUser();
  const parsed = z
    .object({ ...base, password: z.string().min(6, "كلمة المرور 6 أحرف على الأقل") })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return parsed.error.issues[0].message;

  const email = parsed.data.email.toLowerCase();
  if (await prisma.user.findUnique({ where: { email } })) return "هذا البريد مستخدم بالفعل.";

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email,
      role: "STUDENT",
      status: parsed.data.status,
      studentNo: optional(parsed.data.studentNo),
      phone: optional(parsed.data.phone),
      country: optional(parsed.data.country),
      program: optional(parsed.data.program),
      passwordHash: await bcrypt.hash(parsed.data.password, 10),
    },
  });
  revalidatePath("/admin/students");
  redirect("/admin/students");
}

export async function updateStudent(
  id: string,
  _prev: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  await requireUser();
  const parsed = z
    .object({ ...base, password: z.string().optional() })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return parsed.error.issues[0].message;

  const email = parsed.data.email.toLowerCase();
  const clash = await prisma.user.findUnique({ where: { email } });
  if (clash && clash.id !== id) return "هذا البريد مستخدم بحساب آخر.";

  await prisma.user.update({
    where: { id },
    data: {
      name: parsed.data.name,
      email,
      status: parsed.data.status,
      studentNo: optional(parsed.data.studentNo),
      phone: optional(parsed.data.phone),
      country: optional(parsed.data.country),
      program: optional(parsed.data.program),
      ...(parsed.data.password && parsed.data.password.length >= 6
        ? { passwordHash: await bcrypt.hash(parsed.data.password, 10) }
        : {}),
    },
  });
  revalidatePath("/admin/students");
  redirect("/admin/students");
}

export async function deleteStudent(id: string) {
  await requireUser();
  const student = await prisma.user.findUnique({ where: { id } });
  if (!student || student.role !== "STUDENT") return;
  await prisma.user.delete({ where: { id } });
  revalidatePath("/admin/students");
}

/**
 * ينشئ حساب طالب من طلب التحاق مقبول — يوفّر إعادة إدخال البيانات.
 * تُعاد كلمة المرور المؤقّتة لتُسلَّم للطالب.
 */
export async function createStudentFromApplication(applicationId: string) {
  await requireUser();
  const app = await prisma.admissionApplication.findUnique({ where: { id: applicationId } });
  if (!app) return;
  const existing = await prisma.user.findUnique({ where: { email: app.email.toLowerCase() } });
  if (existing) redirect(`/admin/students/${existing.id}`);

  const temp = `hadith-${Math.abs(app.id.split("").reduce((a, c) => a * 31 + c.charCodeAt(0), 7)) % 900000 + 100000}`;
  const created = await prisma.user.create({
    data: {
      name: app.name,
      email: app.email.toLowerCase(),
      role: "STUDENT",
      status: "ACTIVE",
      phone: app.phone,
      country: app.country,
      program: app.program,
      passwordHash: await bcrypt.hash(temp, 10),
    },
  });
  await prisma.admissionApplication.update({
    where: { id: applicationId },
    data: {
      status: "DONE",
      note: `${app.note ? app.note + "\n" : ""}أُنشئ حساب طالب. كلمة المرور المؤقّتة: ${temp}`,
    },
  });
  revalidatePath("/admin/students");
  redirect(`/admin/students/${created.id}`);
}
