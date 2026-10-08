import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { backupOrder } from "@/lib/db-backup";
import { requireAdmin } from "@/lib/guard";

type BulkDelegate = {
  count: () => Promise<number>;
  deleteMany: () => Promise<{ count: number }>;
};

const clientName = (model: string) => model.charAt(0).toLowerCase() + model.slice(1);

function getDelegate(model: string): BulkDelegate | null {
  const delegate = (prisma as unknown as Record<string, unknown>)[clientName(model)];
  if (!delegate || typeof delegate !== "object") return null;
  const candidate = delegate as Partial<BulkDelegate>;
  return typeof candidate.count === "function" && typeof candidate.deleteMany === "function"
    ? (candidate as BulkDelegate)
    : null;
}

/**
 * حذف كل البيانات مع إبقاء الجداول. نتبع ترتيب الاعتماد العكسي لتفريغ
 * الجداول التابعة أولًا، دون أوامر PostgreSQL أو تعطيل مفاتيح MySQL.
 */
export async function POST(req: Request) {
  const user = await requireAdmin();
  let target: string;
  try {
    const meta = await prisma.$queryRaw<{ database: string | null }[]>`SELECT DATABASE() AS database`;
    const dbName = meta[0]?.database;
    if (!dbName) throw new Error("NO_DATABASE");

    const form = await req.formData();
    const confirm = String(form.get("confirm") ?? "").trim();
    if (confirm !== dbName) throw new Error("CONFIRM_MISMATCH");

    const order = backupOrder().reverse();
    const delegates = order.map((model) => ({ model, delegate: getDelegate(model) }))
      .filter((entry): entry is { model: string; delegate: BulkDelegate } => Boolean(entry.delegate));
    if (delegates.length === 0) throw new Error("NO_TABLES");

    const counts = await Promise.all(delegates.map(({ delegate }) => delegate.count().catch(() => 0)));
    const deleted = counts.reduce((sum, count) => sum + count, 0);
    for (const { delegate } of delegates) await delegate.deleteMany();

    await prisma.systemJob.create({
      data: {
        kind: "database.wipe",
        status: "completed",
        payload: { requestedBy: user.id, database: dbName, tables: delegates.length, rowsApprox: deleted },
      },
    });
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "wipe",
        entity: "database",
        metadata: { database: dbName, tables: delegates.length, rowsApprox: deleted },
      },
    });
    target = `/admin/system?wiped=${deleted}&tables=${delegates.length}`;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "FAILED";
    target = `/admin/system?wipeError=${encodeURIComponent(msg)}`;
  }
  redirect(target);
}
