import { prisma } from "@/lib/prisma";

/**
 * هل وضع التصحيح مفعّل؟
 * يقرأ من جدول Setting المفتاح `system.debug` (قيمة "true"/"1"/"on")
 * أو من متغير البيئة DEBUG / NEXT_PUBLIC_DEBUG.
 * لا يرمي استثناءً أبدًا — إن فشلت قراءة القاعدة يعود false،
 * حتى لا تُخفي شاشة الأخطاء نفسها صفحة 500 أخرى.
 */
export async function isDebugEnabled(): Promise<boolean> {
  if (process.env.DEBUG === "true" || process.env.DEBUG === "1" || process.env.NEXT_PUBLIC_DEBUG === "true") {
    return true;
  }
  try {
    const row = await prisma.setting.findUnique({
      where: { key: "system.debug" },
      select: { value: true },
    });
    const raw = row?.value == null ? "" : String(row.value).trim().toLowerCase();
    return raw === "true" || raw === "1" || raw === "on" || raw === "yes";
  } catch {
    return false;
  }
}

/** نسخة متزامنة للمكوّنات العميلة — تقرأ من localStorage / env فقط */
export function isDebugEnabledSync(): boolean {
  if (typeof window !== "undefined") {
    try {
      const v = localStorage.getItem("system.debug");
      if (v && ["true", "1", "on"].includes(v.toLowerCase())) return true;
    } catch {}
  }
  return false;
}
