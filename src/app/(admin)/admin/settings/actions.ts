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
  // Checkbox غير المفعّل لا يُرسل — نعالج system.debug صراحةً
  const hasDebug = [...formData.keys()].includes("system.debug");
  const debugVal = hasDebug ? String(formData.getAll("system.debug").pop() ?? "false") : "false";
  // normalize checkbox: "on" => "true"
  const normalizedEntries = new Map<string, string>();
  for (const [key, val] of formData.entries()) {
    if (key.startsWith("__")) continue;
    if (key === "system.debug") continue; // سنعالجه بعد الحلقة
    normalizedEntries.set(key, String(val));
  }
  if (hasDebug) {
    const v = debugVal === "on" ? "true" : debugVal;
    normalizedEntries.set("system.debug", v === "true" || v === "1" ? "true" : "false");
  } else {
    normalizedEntries.set("system.debug", "false");
  }

  for (const [key, val] of normalizedEntries.entries()) {
    const group = key.includes(".") ? key.split(".")[0] : "general";
    await prisma.setting.upsert({
      where: { key },
      create: { key, group, value: String(val) },
      update: { value: String(val) },
    });
  }
  revalidatePath(redirectTo);
  revalidatePath("/admin/courses");
  redirect(`${redirectTo}?saved=1`);
}
