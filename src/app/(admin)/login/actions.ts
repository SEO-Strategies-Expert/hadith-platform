"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * وجهة ما بعد الدخول حسب الدور.
 *
 * كانت `/admin` ثابتةً للجميع، فكان المحاضر والطالب يُقذفان إليها ثمّ يرتدّان
 * بالحارس — ومضةٌ مربكة ووجهةٌ خاطئة في سجلّ التصفّح. نقرأ الدور من القاعدة
 * لأنّ الجلسة لم تُنشأ بعدُ عند احتساب `redirectTo`.
 *
 * الاستعلام لا يكشف شيئًا: بريدٌ غير موجود يعطي الوجهة الافتراضيّة، ثمّ يفشل
 * تسجيل الدخول نفسه بالرسالة العامّة ذاتها.
 */
async function destinationFor(email: unknown): Promise<string> {
  if (typeof email !== "string" || !email.trim()) return "/admin";
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { role: true },
    });
    if (user?.role === "STUDENT") return "/student";
    if (user?.role === "INSTRUCTOR") return "/instructor";
  } catch {
    // تعذّر الوصول للقاعدة: الوجهة الافتراضيّة، والحارس يصحّحها لاحقًا.
  }
  return "/admin";
}

export async function authenticate(
  _prev: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  try {
    const email = formData.get("email");
    await signIn("credentials", {
      email,
      password: formData.get("password"),
      redirectTo: await destinationFor(email),
    });
    return undefined;
  } catch (error) {
    if (error instanceof AuthError) {
      return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
    }
    throw error; // إعادة توجيه Next.js يجب أن تمرّ
  }
}
