"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guard";

export async function queueBackup() {
  const user = await requireAdmin();
  const job = await prisma.systemJob.create({ data: { kind: "database.backup", payload: { requestedBy: user.id } } });
  await prisma.auditLog.create({ data: { actorId: user.id, action: "queue", entity: "systemJob", entityId: job.id, metadata: { kind: "database.backup" } } });
  revalidatePath("/admin/system");
}
