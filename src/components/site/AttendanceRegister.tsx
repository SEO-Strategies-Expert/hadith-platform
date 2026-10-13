import { prisma } from "@/lib/prisma";
import { teacherSessionWhere, studentSessionWhere } from "@/lib/session-access";
import { AttendanceControls } from "./AttendanceControls";
import { formatDateTime } from "@/components/admin/datetime";
export async function AttendanceRegister({ userId, scholarId }: { userId: string; scholarId?: string | null }) {
  const teacher = !!scholarId;
  const sessions = await prisma.liveSession.findMany({ where: teacher ? teacherSessionWhere(scholarId!) : studentSessionWhere(userId), orderBy: { startsAt: "desc" }, take: 200, include: { attendance: { where: { userId } }, course: { select: { titleAr: true } } } });
  const total = await prisma.attendance.aggregate({ where: { userId, present: true, session: teacher ? teacherSessionWhere(scholarId!) : studentSessionWhere(userId) }, _sum: { minutes: true } });
  const minutes = total._sum.minutes || 0;
  const now = new Date();
  return <section className="container"><h1>{teacher ? "الحضور والدوام" : "جدول المحاضرات والحضور والغياب"}</h1>{teacher && <p>الدوام المسجل: {Math.floor(minutes / 60)} ساعة و{minutes % 60} دقيقة. تُحسب المدة بعد تسجيل الانصراف، ضمن وقت المحاضرة.</p>}
    {!sessions.length && <p>لا توجد محاضرات مسندة إليك.</p>}
    {sessions.map(s => { const a=s.attendance[0]; const end=s.endsAt ?? new Date(s.startsAt.getTime()+s.durationMin*60000); const live=now.getTime()>=s.startsAt.getTime()-15*60000 && now<=end; const url=teacher ? s.zoomStartUrl || s.joinUrl : s.joinUrl;
      return <article key={s.id} className="info-card" style={{ marginBlock: 18, padding: 20, background: "white", borderRadius: 12 }}><h2>{s.titleAr}</h2><p>{s.course?.titleAr} — {formatDateTime(s.startsAt)}</p><p>{a ? a.present ? `حاضر — مدة مسجلة: ${a.minutes} دقيقة` : "غائب" : now>end ? "لم يسجل حضور — غياب" : "لم يبدأ تسجيل الحضور"}</p>
        {url && /^https?:\/\//i.test(url) && (teacher || live) && <a className="btn btn-gold" href={url} target="_blank" rel="noreferrer">◉ {teacher ? "بدء المحاضرة على الزوم" : "دخول المحاضرة"}</a>}
        {(live || (a?.present && !a.leftAt)) && <AttendanceControls sessionId={s.id} teacher={teacher} present={a?.present} closed={!!a?.leftAt} />}
      </article>;
    })}
  </section>;
}
