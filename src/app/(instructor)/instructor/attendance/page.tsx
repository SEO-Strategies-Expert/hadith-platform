import { requireInstructor, ownedCourseFilter } from "@/lib/instructor";
import { prisma } from "@/lib/prisma";
import { teacherSessionWhere } from "@/lib/session-access";
import { AttendanceControls } from "@/components/site/AttendanceControls";
import { PageHeader, Card, Badge, EmptyState } from "@/components/admin/ui";
import { formatDateTime, toLocalInput } from "@/components/admin/datetime";
import { StudentAttendanceEditor } from "@/components/instructor/StudentAttendanceEditor";

export default async function Page() {
  const me = await requireInstructor();
  if (!me.scholarId) return <Card><EmptyState label="اطلب ربط حسابك بملف الهيئة العلمية من الإدارة." /></Card>;
  const ownSessions = teacherSessionWhere(me.scholarId);
  const [sessions, studentSessions, total] = await Promise.all([
    prisma.liveSession.findMany({
      where: ownSessions, orderBy: { startsAt: "desc" }, take: 200,
      include: { attendance: { where: { userId: me.id } }, course: { select: { titleAr: true } } },
    }),
    prisma.liveSession.findMany({
      // Course owners can review their students even when a co-teacher leads a session.
      where: { OR: [ownSessions, { course: ownedCourseFilter(me.scholarId) }] },
      orderBy: { startsAt: "desc" }, take: 200,
      include: {
        attendance: { where: { user: { role: "STUDENT" } }, include: { user: { select: { id: true, name: true, studentNo: true } } } },
        course: { select: { titleAr: true, instructorId: true, instructors: { select: { id: true } }, enrollments: {
          where: { status: { in: ["ACTIVE", "COMPLETED"] }, user: { role: "STUDENT" } },
          select: { enrolledAt: true, user: { select: { id: true, name: true, studentNo: true } } },
        } } },
        stage: { select: { titleAr: true, stageEnrollments: {
          where: { status: { in: ["ACTIVE", "COMPLETED"] }, user: { role: "STUDENT" } },
          select: { startedAt: true, user: { select: { id: true, name: true, studentNo: true } } },
        } } },
      },
    }),
    prisma.attendance.aggregate({ where: { userId: me.id, present: true, session: ownSessions }, _sum: { minutes: true } }),
  ]);
  const minutes = total._sum.minutes ?? 0;
  const now = new Date();

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader title="الحضور والدوام" desc="متابعة حضور طلاب مقرراتك وتسجيل حضورك وانصرافك من المحاضرات." />

      <section className="space-y-4" aria-labelledby="student-attendance-heading">
        <div><h2 id="student-attendance-heading" className="text-[18px] font-extrabold text-navy-900">حضور الطلاب وغيابهم</h2><p className="mt-1 text-[12.5px] leading-6 text-ink-soft">أحدث ٢٠٠ محاضرة في مقرراتك أو مسندة إليك. يظهر الطلاب المسجلون وسجلات الحضور الفعلية لكل محاضرة.</p></div>
        {!studentSessions.length && <Card><EmptyState label="لا توجد محاضرات في مقرراتك بعد. تُضاف المحاضرات من لوحة الإدارة." /></Card>}
        {studentSessions.map(session => {
          const end = session.endsAt ?? new Date(session.startsAt.getTime() + session.durationMin * 60_000);
          const ended = now > end;
          const canManage = session.course && (session.course.instructorId === me.scholarId || session.course.instructors.some(instructor => instructor.id === me.scholarId));
          const records = new Map(session.attendance.map(record => [record.userId, record]));
          const students = new Map(session.attendance.map(record => [record.userId, record.user]));
          for (const enrollment of session.course?.enrollments ?? []) {
            if (enrollment.enrolledAt <= end) students.set(enrollment.user.id, enrollment.user);
          }
          for (const enrollment of session.stage?.stageEnrollments ?? []) {
            if (enrollment.startedAt <= end) students.set(enrollment.user.id, enrollment.user);
          }
          const rows = Array.from(students.values()).sort((a, b) => a.name.localeCompare(b.name, "ar"));
          const present = session.attendance.filter(record => record.present).length;
          const absent = session.attendance.filter(record => !record.present).length;
          return (
            <Card key={session.id}>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-black/5 p-4 sm:p-5">
                <div><h3 className="text-[15px] font-extrabold text-navy-900">{session.titleAr}</h3><p className="mt-1 text-[12px] leading-6 text-ink-soft">{session.course?.titleAr ?? session.stage?.titleAr ?? "محاضرة عامة"} — {formatDateTime(session.startsAt)}</p></div>
                <div className="flex flex-wrap gap-2"><Badge tone="blue">{rows.length} طالب</Badge><Badge tone="green">{present} حاضر</Badge><Badge tone="red">{absent} غائب</Badge>{ended && rows.length > records.size && <Badge tone="gray">{rows.length - records.size} لم يسجل حضورًا</Badge>}</div>
              </div>
              {!rows.length ? <EmptyState label="لا يوجد طلاب مسجلون أو سجلات حضور لهذه المحاضرة بعد." /> : (
                <div className="overflow-x-auto rounded-b-2xl">
                  <table className="w-full min-w-[680px] text-right text-[13px]">
                    <thead className="bg-slate-50 text-[12px] text-ink-soft"><tr>{["الطالب", "الحالة", "وقت الحضور", "وقت الانصراف", "الدقائق", ...(canManage ? ["إدارة الحضور"] : [])].map(title => <th key={title} scope="col" className="px-4 py-3 font-bold">{title}</th>)}</tr></thead>
                    <tbody>{rows.map(student => {
                      const record = records.get(student.id);
                      return <tr key={student.id} className="border-t border-black/5 hover:bg-slate-50/70">
                        <td className="px-4 py-3"><div className="font-bold text-navy-900">{student.name}</div>{student.studentNo && <div dir="ltr" className="mt-1 text-right text-[11px] text-ink-soft">{student.studentNo}</div>}</td>
                        <td className="whitespace-nowrap px-4 py-3"><Badge tone={record ? record.present ? "green" : "red" : "gray"}>{record ? record.present ? "حاضر" : "غائب" : ended ? "لم يسجل حضورًا" : "بانتظار الحضور"}</Badge></td>
                        <td className="px-4 py-3 text-[12px] text-ink-soft">{record?.present ? formatDateTime(record.joinedAt) : "—"}</td>
                        <td className="px-4 py-3 text-[12px] text-ink-soft">{record?.present ? formatDateTime(record.leftAt) : "—"}</td>
                        <td className="px-4 py-3 font-bold text-navy-900">{record?.minutes ?? "—"}</td>
                        {canManage && <td className="px-4 py-3 align-top"><StudentAttendanceEditor
                          sessionId={session.id}
                          userId={student.id}
                          studentName={student.name}
                          record={{
                            exists: !!record,
                            present: record?.present ?? true,
                            joinedAt: toLocalInput(record?.present ? record.joinedAt : session.startsAt) ?? "",
                            leftAt: toLocalInput(record?.present ? record.leftAt : end) ?? "",
                            note: record?.note ?? "",
                          }}
                        /></td>}
                      </tr>;
                    })}</tbody>
                  </table>
                </div>
              )}
            </Card>
          );
        })}
      </section>

      <section className="space-y-4" aria-labelledby="teacher-attendance-heading">
        <h2 id="teacher-attendance-heading" className="text-[18px] font-extrabold text-navy-900">حضوري ودوامي</h2>
        <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div><p className="text-[13px] font-bold text-ink-soft">إجمالي الدوام المسجل</p><p className="mt-2 text-xl font-extrabold text-navy-900">{Math.floor(minutes / 60)} ساعة و{minutes % 60} دقيقة</p></div>
          <p className="max-w-md text-[12.5px] leading-6 text-ink-soft">تُحسب المدة بعد تسجيل الانصراف، ضمن وقت المحاضرة. يفتح تسجيل الحضور قبل بدايتها بربع ساعة.</p>
        </Card>
        {!sessions.length && <Card><EmptyState label="لا توجد محاضرات مسندة إليك لتسجيل دوامك بعد." /></Card>}
        {sessions.map(session => {
          const attendance = session.attendance[0];
          const end = session.endsAt ?? new Date(session.startsAt.getTime() + session.durationMin * 60_000);
          const live = now.getTime() >= session.startsAt.getTime() - 15 * 60_000 && now <= end;
          const url = session.zoomStartUrl || session.joinUrl;
          return <Card key={session.id} className="p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-[15px] font-extrabold text-navy-900">{session.titleAr}</h3><p className="mt-1 text-[12px] leading-6 text-ink-soft">{session.course?.titleAr} — {formatDateTime(session.startsAt)}</p></div><Badge tone={attendance ? attendance.present ? "green" : "red" : "gray"}>{attendance ? attendance.present ? `حاضر — ${attendance.minutes} دقيقة` : "غائب" : now > end ? "لم يسجل حضور" : "بانتظار الحضور"}</Badge></div>
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-black/5 pt-4">
              {url && /^https?:\/\//i.test(url) && <a href={url} target="_blank" rel="noreferrer" className="rounded-xl bg-navy-800 px-4 py-2.5 text-[13px] font-bold text-white hover:bg-navy-900">بدء المحاضرة على الزوم</a>}
              {(live || (attendance?.present && !attendance.leftAt)) && <AttendanceControls sessionId={session.id} teacher present={attendance?.present} closed={!!attendance?.leftAt} />}
              {!live && !(attendance?.present && !attendance.leftAt) && <span className="text-[12px] text-ink-soft">{attendance?.leftAt ? "اكتمل تسجيل الدوام" : "تسجيل الحضور متاح خلال وقت المحاضرة"}</span>}
            </div>
          </Card>;
        })}
      </section>
    </div>
  );
}
