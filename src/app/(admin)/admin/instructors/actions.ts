"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guard";

/**
 * ربط حساب محاضر بملفّه في الهيئة العلميّة.
 *
 * لماذا `requireAdmin` لا `requireUser`؟ لأنّ هذا الربط **عمليّة صلاحيّات**:
 * من يُسنَد إليه ملفّ عضو هيئة يرى فورًا مقرّرات ذلك الملفّ وطلابه وروابط
 * مضيف مجالسه. فليست من عمل المحرّر.
 */

const PATH = "/admin/instructors";

/**
 * `User.scholarId` بلا قيد تفرّد في القاعدة (تعذّرت إضافته)، فالتفرّد يُفرَض
 * هنا: بحثٌ عن حاملٍ آخر لنفس الملفّ قبل الكتابة. ليست هذه حمايةً ذرّيّة —
 * لو وقع طلبان في اللحظة نفسها لمرّا معًا — لكنّ الإسناد عمليّة إداريّة نادرة
 * بيد شخص واحد، والبديل (قيد قاعدة) خارج ملكيّتي.
 */
export async function assignScholar(
  userId: string,
  _prev: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  await requireAdmin();

  const parsed = z
    .object({ scholarId: z.string().min(1, "اختر ملفّ عضو الهيئة أوّلًا.") })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return parsed.error.issues[0].message;
  const { scholarId } = parsed.data;

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!target) return "الحساب غير موجود.";
  if (target.role !== "INSTRUCTOR") return "هذا الحساب ليس بدور «عضو هيئة تدريس».";

  const scholar = await prisma.scholar.findUnique({
    where: { id: scholarId },
    select: { id: true, nameAr: true },
  });
  if (!scholar) return "ملفّ عضو الهيئة غير موجود.";

  const clash = await prisma.user.findFirst({
    where: { scholarId, id: { not: userId } },
    select: { name: true, email: true },
  });
  if (clash)
    return `ملفّ «${scholar.nameAr}» مسنَد بالفعل إلى حساب ${clash.name} (${clash.email}). فُكّ إسناده أوّلًا.`;

  await prisma.user.update({ where: { id: userId }, data: { scholarId } });
  revalidatePath(PATH);
  return undefined;
}

/** فكّ الإسناد — الحساب يبقى `INSTRUCTOR` لكنّ لوحته تفرغ حتى يُربط من جديد. */
export async function unassignScholar(userId: string) {
  await requireAdmin();
  await prisma.user.update({ where: { id: userId }, data: { scholarId: null } });
  revalidatePath(PATH);
}

/**
 * ترقية حساب قائم إلى `INSTRUCTOR`.
 * بالبريد لا بقائمة منسدلة: قائمة كل الحسابات (وفيها الطلاب) تطول وتُخطئ العين.
 */
export async function promoteToInstructor(
  _prev: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  await requireAdmin();

  const parsed = z
    .object({ email: z.string().email("بريد غير صحيح") })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return parsed.error.issues[0].message;

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true, name: true },
  });
  if (!user) return "لا حساب بهذا البريد. أنشئه أوّلًا من «المستخدمون والأدوار».";
  if (user.role === "INSTRUCTOR") return "هذا الحساب عضو هيئة تدريس بالفعل.";
  // المدير لا يُخفَّض من هنا — إسقاط صلاحيّاته سهوًا يقفل اللوحة على أهلها.
  if (user.role === "ADMIN")
    return "هذا حساب مدير. غيّر دوره من «المستخدمون والأدوار» إن كان ذلك مقصودًا.";

  await prisma.user.update({ where: { id: user.id }, data: { role: "INSTRUCTOR" } });
  revalidatePath(PATH);
  return undefined;
}
