"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { adminNoticeWhere } from "@/lib/admin-notifications";

const KINDS = ["enrollment", "contact"] as const;

export async function markNoticeRead(id: string) {
  const me = await requireUser();
  if (!me.id) return;
  await prisma.notification.updateMany({
    where: { id, userId: me.id, kind: { in: [...KINDS] } },
    data: { readAt: new Date() },
  });
  revalidatePath("/admin", "layout");
  revalidatePath("/admin/notifications");
}

export async function markAllNoticesRead() {
  const me = await requireUser();
  if (!me.id) return;
  await prisma.notification.updateMany({
    where: adminNoticeWhere(me.id, "unread"),
    data: { readAt: new Date() },
  });
  revalidatePath("/admin", "layout");
  revalidatePath("/admin/notifications");
}
