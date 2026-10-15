import { prisma } from "@/lib/prisma";

/** Give each student without a manually assigned number a stable college number. */
export async function ensureUniversityNumber(userId: string): Promise<string | null> {
  const student = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, studentNo: true, createdAt: true },
  });
  if (!student || student.role !== "STUDENT") return null;
  if (student.studentNo?.trim()) return student.studentNo.trim();

  const number = `HC-${student.createdAt.getFullYear()}-${student.id.slice(-8).toUpperCase()}`;
  await prisma.user.updateMany({
    where: { id: student.id, studentNo: student.studentNo },
    data: { studentNo: number },
  });
  const updated = await prisma.user.findUnique({ where: { id: student.id }, select: { studentNo: true } });
  return updated?.studentNo?.trim() || number;
}
