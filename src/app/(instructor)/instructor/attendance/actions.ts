"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireInstructor, ownedCourseFilter } from "@/lib/instructor";
import { fromLocalInput } from "@/components/admin/datetime";

export type AttendanceEditState = { error?: string; success?: string };

const schema = z.object({
  sessionId: z.string().min(1),
  userId: z.string().min(1),
  mode: z.enum(["save", "delete"]),
  status: z.enum(["present", "absent"]),
  joinedAt: z.string(),
  leftAt: z.string(),
  note: z.string().trim().max(191),
});

function parseTime(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  return fromLocalInput(value);
}

export async function manageStudentAttendance(_prev: AttendanceEditState, form: FormData): Promise<AttendanceEditState> {
  const me = await requireInstructor();
  if (!me.scholarId) return { error: "يجب ربط حسابك بملف الهيئة العلمية." };
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "تحقق من بيانات الحضور والملاحظات (١٩١ حرفًا كحد أقصى)." };
  const data = parsed.data;

  const result = await prisma.$transaction(async tx => {
    // Scope every mutation to a course owned by this instructor, regardless of posted IDs.
    const session = await tx.liveSession.findFirst({
      where: { id: data.sessionId, course: ownedCourseFilter(me.scholarId!) },
      select: { id: true, courseId: true, startsAt: true, endsAt: true, durationMin: true },
    });
    if (!session?.courseId) return { error: "لا يمكنك إدارة حضور محاضرة خارج مقرراتك." };
    const student = await tx.user.findFirst({
      where: { id: data.userId, role: "STUDENT", enrollments: { some: { courseId: session.courseId } } },
      select: { id: true },
    });
    if (!student) return { error: "الطالب غير مسجل في هذا المقرر." };
    const key = { userId_sessionId: { userId: student.id, sessionId: session.id } };
    const existing = await tx.attendance.findUnique({ where: key });

    if (data.mode === "delete") {
      await tx.attendance.deleteMany({ where: { userId: student.id, sessionId: session.id } });
      return { success: "تم حذف سجل الحضور." };
    }

    const end = session.endsAt ?? new Date(session.startsAt.getTime() + session.durationMin * 60_000);
    if (!existing) {
      const enrollment = await tx.enrollment.findFirst({ where: {
        userId: student.id, courseId: session.courseId,
        status: { in: ["ACTIVE", "COMPLETED"] }, enrolledAt: { lte: end },
      } });
      if (!enrollment) return { error: "لا يمكن إنشاء حضور لطالب غير مسجل وقت المحاضرة أو تسجيله غير مفعّل." };
    }
    const present = data.status === "present";
    const joinedAt = present ? parseTime(data.joinedAt) : session.startsAt;
    const leftAt = present && data.leftAt ? parseTime(data.leftAt) : null;
    if (!joinedAt || (present && data.leftAt && !leftAt)) return { error: "أدخل مواعيد الحضور والانصراف بصورة صحيحة." };
    if (present && (joinedAt.getTime() < session.startsAt.getTime() - 15 * 60_000 || joinedAt > end || (leftAt && (leftAt < joinedAt || leftAt > end)))) {
      return { error: "يجب أن يكون الحضور من ربع ساعة قبل المحاضرة وحتى نهايتها، والانصراف بعد الحضور وقبل نهاية المحاضرة." };
    }
    const minutes = present && leftAt ? Math.max(0, Math.floor((leftAt.getTime() - Math.max(joinedAt.getTime(), session.startsAt.getTime())) / 60_000)) : 0;
    const values = { present, joinedAt, leftAt, minutes, note: data.note || null, source: "manual" };
    await tx.attendance.upsert({ where: key, create: { ...values, userId: student.id, sessionId: session.id }, update: values });
    return { success: present ? "تم حفظ حضور الطالب وحساب المدة." : "تم تسجيل غياب الطالب." };
  });

  if (result.success) {
    for (const path of ["/instructor/attendance", "/instructor/sessions", `/instructor/sessions/${data.sessionId}`, "/student/attendance", "/en/student/attendance", "/student/sessions", "/en/student/sessions", "/admin/sessions", `/admin/sessions/${data.sessionId}`]) revalidatePath(path);
  }
  return result;
}
