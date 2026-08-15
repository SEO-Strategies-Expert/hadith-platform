"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import type { Lang } from "@/lib/site-data";

/** دخول الطالب من بوابة الطلاب — يستخدم نفس مزوّد المصادقة. */
export async function studentLogin(
  lang: Lang,
  _prev: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: lang === "en" ? "/en/student" : "/student",
    });
    return undefined;
  } catch (error) {
    if (error instanceof AuthError) {
      return lang === "en"
        ? "Incorrect email or password."
        : "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
    }
    throw error; // إعادة توجيه Next.js يجب أن تمرّ
  }
}

export async function studentLogout(lang: Lang) {
  await signOut({ redirectTo: lang === "en" ? "/en/student-login.html" : "/student-login.html" });
}
