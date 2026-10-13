"use server";
import { prisma } from "@/lib/prisma";
import { requireInstructor } from "@/lib/instructor";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";

export async function saveInstructorProfile(_prev: string | undefined, form: FormData): Promise<string | undefined> {
  const me = await requireInstructor();
  if (!me.scholarId) return "يرجى ربط حسابك بملف عضو الهيئة العلمية لدى الإدارة.";
  const parsed = z.object({ name: z.string().trim().min(2).max(191), email: z.string().trim().email().max(191), password: z.string().max(200), nameEn: z.string().trim().min(2).max(191), rankAr: z.string().max(191), specAr: z.string().max(191), countryAr: z.string().max(191), bioAr: z.string().max(50000), photoUrl: z.string().max(191) }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return "تحقق من الاسم والبريد وطول الحقول.";
  const d = parsed.data;
  if (d.password && d.password.length < 8) return "كلمة المرور ثمانية أحرف على الأقل.";
  if (d.photoUrl && !/^(https?:\/\/|\/api\/blob\/|\/assets\/)/i.test(d.photoUrl)) return "رابط الصورة غير صحيح.";
  const email = d.email.toLowerCase();
  const duplicate = await prisma.user.findFirst({ where: { email, id: { not: me.id } } });
  if (duplicate) return "البريد مستخدم في حساب آخر.";
  await prisma.$transaction([
    prisma.user.update({ where: { id: me.id }, data: { name: d.name, email, avatarUrl: d.photoUrl || null, ...(d.password ? { passwordHash: await bcrypt.hash(d.password, 12) } : {}) } }),
    prisma.scholar.update({ where: { id: me.scholarId }, data: { nameAr: d.name, nameEn: d.nameEn, rankAr: d.rankAr, specAr: d.specAr, countryAr: d.countryAr, bioAr: d.bioAr.slice(0,191), photoUrl: d.photoUrl || null } }),
    prisma.setting.upsert({ where: { key: `instructor.bio.${me.scholarId}` }, create: { key: `instructor.bio.${me.scholarId}`, group: "faculty", value: d.bioAr }, update: { value: d.bioAr } }),
  ]);
  revalidatePath("/instructor", "layout");
  revalidatePath("/faculty.html");
  revalidatePath(`/faculty/${me.scholarId}`);
  redirect("/instructor/profile?saved=1");
}
