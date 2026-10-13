"use server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/guard";
import { teacherSessionWhere, studentSessionWhere } from "@/lib/session-access";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

export async function recordAttendance(_prev: string | undefined, form: FormData): Promise<string | undefined> {
  const sessionUser = await currentUser();
  if (!sessionUser?.id) return "سجّل الدخول أولًا.";
  const me = await prisma.user.findUnique({ where: { id: sessionUser.id } });
  if (!me || me.status !== "ACTIVE") return "الحساب غير مفعل.";
  const teacher = me.role === "INSTRUCTOR";
  if ((!teacher && me.role !== "STUDENT") || (teacher && !me.scholarId)) return "لا يمكنك تسجيل الحضور بهذا الحساب.";
  const id = String(form.get("sessionId") || "");
  const mode = String(form.get("mode") || "");
  if (!["in", "out", "absent"].includes(mode) || (teacher && mode === "absent")) return "الطلب غير صحيح.";
  const s = await prisma.liveSession.findFirst({ where: { id, ...(teacher ? teacherSessionWhere(me.scholarId!) : studentSessionWhere(me.id)) } });
  if (!s) return "المحاضرة غير متاحة لك.";
  const now = new Date();
  const end = s.endsAt ?? new Date(s.startsAt.getTime() + s.durationMin * 60000);
  if (mode !== "out" && (now.getTime() < s.startsAt.getTime() - 15 * 60000 || now > end)) return "يفتح تسجيل الحضور قبل المحاضرة بربع ساعة وحتى نهايتها.";
  const key = { userId_sessionId: { userId: me.id, sessionId: s.id } };
  if (mode === "out") {
    const record = await prisma.attendance.findUnique({ where: key });
    if (!record?.present || record.leftAt) return "لا يوجد حضور مفتوح لتسجيل الانصراف.";
    const leftAt = new Date(Math.min(now.getTime(), end.getTime()));
    const minutes = Math.max(0, Math.floor((leftAt.getTime() - Math.max(record.joinedAt.getTime(), s.startsAt.getTime())) / 60000));
    await prisma.attendance.updateMany({ where: { id: record.id, leftAt: null }, data: { leftAt, minutes } });
  } else {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.attendance.create({ data: { userId: me.id, sessionId: s.id, joinedAt: now, present: mode !== "absent", source: teacher ? "instructor-self" : "student-self", note: mode === "absent" ? String(form.get("note") || "غياب مسجل من الطالب").slice(0,191) : null } });
        if (teacher) {
          const admins = await tx.user.findMany({ where: { role: "ADMIN", status: "ACTIVE" }, select: { id: true } });
          if (admins.length) await tx.notification.createMany({ data: admins.map((admin) => ({ userId: admin.id, kind: "instructor-attendance", titleAr: "تسجيل حضور معلم", titleEn: "Teacher checked in", bodyAr: `${me.name} سجّل حضوره لمحاضرة «${s.titleAr}».`, bodyEn: `${me.name} checked in for ${s.titleEn}.`, href: `/admin/sessions/${s.id}` })) });
        }
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return "سُجل حضورك أو غيابك مسبقًا لهذه المحاضرة.";
      throw e;
    }
  }
  for (const path of ["/instructor/attendance", "/instructor/sessions", "/student/attendance", "/en/student/attendance", "/student/sessions", "/en/student/sessions", "/admin/notifications", `/admin/sessions/${id}`]) revalidatePath(path);
  return mode === "out" ? "تم تسجيل الانصراف وحساب مدة الدوام." : mode === "absent" ? "تم تسجيل الغياب." : "تم تسجيل الحضور.";
}
