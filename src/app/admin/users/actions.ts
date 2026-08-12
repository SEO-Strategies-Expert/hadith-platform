"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, currentUser } from "@/lib/guard";

const base = {
  name: z.string().min(2, "الاسم قصير جدًّا"),
  email: z.string().email("بريد غير صحيح"),
  role: z.enum(["ADMIN", "EDITOR"]),
  status: z.enum(["ACTIVE", "DISABLED"]),
};

export async function createUser(
  _prev: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  await requireAdmin();
  const parsed = z
    .object({ ...base, password: z.string().min(6, "كلمة المرور 6 أحرف على الأقل") })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return parsed.error.issues[0].message;

  const email = parsed.data.email.toLowerCase();
  if (await prisma.user.findUnique({ where: { email } }))
    return "هذا البريد مستخدم بالفعل.";

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email,
      role: parsed.data.role,
      status: parsed.data.status,
      passwordHash: await bcrypt.hash(parsed.data.password, 10),
    },
  });
  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function updateUser(
  id: string,
  _prev: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  await requireAdmin();
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
      role: parsed.data.role,
      status: parsed.data.status,
      ...(parsed.data.password && parsed.data.password.length >= 6
        ? { passwordHash: await bcrypt.hash(parsed.data.password, 10) }
        : {}),
    },
  });
  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function deleteUser(id: string) {
  await requireAdmin();
  const me = await currentUser();
  if (me?.id === id) return; // لا تحذف نفسك
  await prisma.user.delete({ where: { id } });
  revalidatePath("/admin/users");
}
