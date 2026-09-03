import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guard";
import { exportDatabase } from "@/lib/db-backup";

/** تنزيل نسخة JSON كاملة من قاعدة البيانات الحالية (مدير فقط). */
export async function GET() {
  await requireAdmin();
  let database: string | null = null;
  try {
    const meta = await prisma.$queryRaw<{ database: string }[]>`SELECT current_database() AS database`;
    database = meta[0]?.database ?? null;
  } catch {
    /* يُسمّى الملف بتاريخ اليوم فقط */
  }
  const payload = await exportDatabase(database);
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(payload), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename=db-backup-${stamp}.json`,
    },
  });
}
