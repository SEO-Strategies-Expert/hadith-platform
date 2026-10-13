import type { Prisma } from "@prisma/client";
import { ownedCourseFilter } from "@/lib/instructor";
export function teacherSessionWhere(scholarId: string): Prisma.LiveSessionWhereInput {
  return { OR: [{ instructorId: scholarId }, { instructorId: null, course: ownedCourseFilter(scholarId) }] };
}
export function studentSessionWhere(userId: string): Prisma.LiveSessionWhereInput {
  return { visible: true, OR: [
    { course: { enrollments: { some: { userId, status: { in: ["ACTIVE", "COMPLETED"] } } } } },
    { stage: { stageEnrollments: { some: { userId, status: { in: ["ACTIVE", "COMPLETED"] } } } } },
    { isPublic: true },
  ] };
}
