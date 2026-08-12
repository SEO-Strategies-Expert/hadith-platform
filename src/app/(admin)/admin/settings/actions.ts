"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";

// يحفظ مجموعة إعدادات key/value. أسماء الحقول = مفاتيح الإعداد.
// group مُمرَّر ضمنيًّا عبر حقل مخفي group:<key> اختياري.
export async function saveSettings(
  redirectTo: string,
  _prev: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  await requireUser();
  for (const [key, val] of formData.entries()) {
    if (key.startsWith("__")) continue;
    const group = key.includes(".") ? key.split(".")[0] : "general";
    await prisma.setting.upsert({
      where: { key },
      create: { key, group, value: String(val) },
      update: { value: String(val) },
    });
  }
  revalidatePath(redirectTo);
  redirect(`${redirectTo}?saved=1`);
}
