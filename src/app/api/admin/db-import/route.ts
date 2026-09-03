import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guard";
import { importDatabase, type BackupPayload } from "@/lib/db-backup";

/**
 * استعادة من ملفّ النسخة (JSON من /api/admin/db-export).
 * دمج فقط: تُدرج الصفوف الغائبة وتتجاهل الموجودة — لا تحذف شيئًا.
 */
export async function POST(req: Request) {
  const user = await requireAdmin();
  try {
    const form = await req.formData();
    const file = form.get("backup");
    if (!(file instanceof File)) throw new Error("NO_FILE");
    const text = await file.text();
    const payload = JSON.parse(text) as BackupPayload;
    const { results, total } = await importDatabase(payload);
    const failed = results.filter((r) => r.error);
    await prisma.systemJob.create({
      data: {
        kind: "database.restore",
        status: failed.length ? "failed" : "completed",
        payload: { requestedBy: user.id, inserted: total, failed: failed.map((f) => f.model) },
      },
    });
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "restore",
        entity: "database",
        metadata: { inserted: total, tables: results.length },
      },
    });
    if (failed.length) redirect(`/admin/system?restoreError=${encodeURIComponent(`أُدرج ${total} صفًّا، وفشل: ${failed.map((f) => f.model).join("، ")}`)}`);
    redirect(`/admin/system?restored=${total}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "FAILED";
    redirect(`/admin/system?restoreError=${encodeURIComponent(msg)}`);
  }
}
