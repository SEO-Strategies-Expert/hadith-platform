"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/guard";

export async function updateProfile(_prev: string | undefined, formData: FormData): Promise<string | undefined> {
  const me = await currentUser();
  if (!me?.id) return "يجب تسجيل الدخول أولًا.";
  const parsed = z.object({ name: z.string().trim().min(2, "الاسم قصير جدًّا"), email: z.string().trim().email("البريد غير صحيح"), avatarUrl: z.string().trim().optional(), password: z.string().optional() }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return parsed.error.issues[0].message;
  if (parsed.data.password && parsed.data.password.length < 6) return "كلمة المرور 6 أحرف على الأقل.";
  const email = parsed.data.email.toLowerCase();
  const clash = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (clash && clash.id !== me.id) return "هذا البريد مستخدم بحساب آخر.";
  await prisma.user.update({ where: { id: me.id }, data: { name: parsed.data.name, email, avatarUrl: parsed.data.avatarUrl || null, ...(parsed.data.password ? (parsed.data.password.length < 6 ? {} : { passwordHash: await bcrypt.hash(parsed.data.password, 10) }) : {}) } });
  revalidatePath("/admin/profile");
  redirect("/admin/profile?saved=1");
}
