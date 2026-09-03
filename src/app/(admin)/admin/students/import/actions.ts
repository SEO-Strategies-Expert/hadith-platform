"use server";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guard";

export async function importStudents(_prev: string | undefined, formData: FormData) {
  const actor = await requireAdmin();
  const text = String(formData.get("csv") ?? "").trim();
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return "ألصق رأس الأعمدة وصفًا واحدًا على الأقل.";
  const headers = lines[0].split(",").map((x) => x.trim());
  for (const line of lines.slice(1)) {
    const values = line.split(",").map((x) => x.trim());
    const row = Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
    if (!row.name || !row.email || !row.password) return "كل صف يحتاج name,email,password.";
    await prisma.user.upsert({ where: { email: row.email.toLowerCase() }, create: { name: row.name, email: row.email.toLowerCase(), passwordHash: await bcrypt.hash(row.password, 12), role: "STUDENT", studentNo: row.studentNo || null, program: row.program || null }, update: { name: row.name, studentNo: row.studentNo || null, program: row.program || null } });
  }
  await prisma.auditLog.create({ data: { actorId: actor.id, action: "bulk-import", entity: "user", metadata: { rows: lines.length - 1 } } });
  revalidatePath("/admin/students");
  return `تم استيراد ${lines.length - 1} طالبًا.`;
}
