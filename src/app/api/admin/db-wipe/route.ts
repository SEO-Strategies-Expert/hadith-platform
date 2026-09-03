import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guard";

const SAFE_IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;

/**
 * حذف كل البيانات: TRUNCATE لكل جداول الـpublic مع CASCADE وإعادة العدّادات.
 * الجداول نفسها تبقى — الصفوف فقط تُحذَف (بما فيها حساب المدير نفسه).
 * الحماية: يجب كتابة اسم قاعدة البيانات الحالي حرفيًّا في حقل confirm.
 * الجلسة JWT فتبقى صالحة بعد الحذف، فيمكن الاستعادة فورًا من نسخة.
 */
export async function POST(req: Request) {
  const user = await requireAdmin();
  // انظر db-import: الـredirect خارج try حتى لا يبتلع الـcatch رسالة NEXT_REDIRECT.
  let target: string;
  try {
    const meta = await prisma.$queryRaw<{ database: string }[]>`SELECT current_database() AS database`;
    const dbName = meta[0]?.database;
    if (!dbName) throw new Error("NO_DATABASE");

    const form = await req.formData();
    const confirm = String(form.get("confirm") ?? "").trim();
    if (confirm !== dbName) throw new Error("CONFIRM_MISMATCH");

    const tables = await prisma.$queryRaw<{ tablename: string }[]>`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'`;
    const names = tables.map((t) => t.tablename).filter((n) => SAFE_IDENT.test(n));
    if (names.length === 0) throw new Error("NO_TABLES");

    // عدّ الصفوف قبل الحذف للتقرير (تقديري سريع من reltuples).
    let deleted = 0;
    try {
      const counts = await prisma.$queryRaw<{ c: bigint }[]>`
        SELECT SUM(reltuples)::bigint AS c FROM pg_class
        WHERE relkind = 'r' AND relnamespace = 'public'::regnamespace`;
      deleted = counts[0]?.c != null ? Number(counts[0].c) : 0;
    } catch {
      /* التقرير تجميلي — الحذف هو الأساس */
    }

    const quoted = names.map((n) => `"${n}"`).join(", ");
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE`);

    await prisma.systemJob.create({
      data: {
        kind: "database.wipe",
        status: "completed",
        payload: { requestedBy: user.id, database: dbName, tables: names.length, rowsApprox: deleted },
      },
    });
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "wipe",
        entity: "database",
        metadata: { database: dbName, tables: names.length, rowsApprox: deleted },
      },
    });
    target = `/admin/system?wiped=${deleted}&tables=${names.length}`;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "FAILED";
    target = `/admin/system?wipeError=${encodeURIComponent(msg)}`;
  }
  redirect(target);
}
