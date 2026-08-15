"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { getInbox, STATUS_LABELS } from "@/lib/inbox";

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function updateEntry(
  kind: string,
  id: string,
  _prev: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  await requireUser();
  const cfg = getInbox(kind);
  if (!cfg) return "صندوق غير معروف.";

  const status = String(formData.get("status") ?? "NEW");
  if (!(status in STATUS_LABELS)) return "حالة غير صالحة.";
  const note = String(formData.get("note") ?? "").trim();

  try {
    await (prisma as any)[cfg.model].update({
      where: { id },
      data: { status, note: note === "" ? null : note },
    });
  } catch {
    return "تعذّر الحفظ. حاول مجددًا.";
  }
  revalidatePath(`/admin/inbox/${kind}`);
  redirect(`/admin/inbox/${kind}`);
}

export async function deleteEntry(kind: string, id: string) {
  await requireUser();
  const cfg = getInbox(kind);
  if (!cfg) return;
  await (prisma as any)[cfg.model].delete({ where: { id } });
  revalidatePath(`/admin/inbox/${kind}`);
}
