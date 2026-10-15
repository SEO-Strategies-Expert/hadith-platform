"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guard";
import { fromLocalInput, toLocalInput } from "@/components/admin/datetime";

export async function moveCalendarEntry(id: string, day: string): Promise<{ error?: string; success?: string }> {
  await requireAdmin();
  if (typeof id !== "string" || !id || typeof day !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return { error: "الموعد أو التاريخ غير صحيح." };
  if (Number(day.slice(0, 4)) < 1000) return { error: "التاريخ المحدد غير صحيح." };
  const target = fromLocalInput(`${day}T12:00`);
  if (!target || toLocalInput(target)?.slice(0, 10) !== day) return { error: "التاريخ المحدد غير صحيح." };
  const entry = await prisma.academicCalendarEntry.findUnique({ where: { id } });
  if (!entry) return { error: "هذا الموعد لم يعد موجودًا. أعد تحميل التقويم." };
  const time = toLocalInput(entry.startsAt)?.slice(11);
  const startsAt = time ? fromLocalInput(`${day}T${time}`) : null;
  if (!startsAt) return { error: "تعذر حساب موعد البداية." };
  startsAt.setUTCSeconds(entry.startsAt.getUTCSeconds(), entry.startsAt.getUTCMilliseconds());
  // Preserve the event's local start time and elapsed duration when moving days.
  const duration = entry.endsAt ? entry.endsAt.getTime() - entry.startsAt.getTime() : null;
  if (duration !== null && duration < 0) return { error: "نهاية الموعد تسبق بدايته؛ صحح الموعد من صفحة التعديل أولًا." };
  await prisma.academicCalendarEntry.update({ where: { id }, data: {
    startsAt, endsAt: duration === null ? null : new Date(startsAt.getTime() + duration),
  } });
  revalidatePath("/admin/calendar");
  revalidatePath(`/admin/calendar/${id}`);
  return { success: `تم نقل الموعد إلى ${day}.` };
}
