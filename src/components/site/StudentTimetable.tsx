import type { CSSProperties } from "react";
import { prisma } from "@/lib/prisma";
import { studentSessionWhere } from "@/lib/session-access";
import { SITE_TZ } from "@/components/admin/datetime";

/**
 * جدول المحاضرات الأسبوعي للطالب: محاضرات الأسبوعين القادمين مجمّعة حسب
 * اليوم، مع الوقت والمادة والأستاذ والمدة ورابط الدخول وقت البث.
 */
const cell: CSSProperties = { border: "1px solid #e5dcc8", padding: "8px 10px", textAlign: "start", verticalAlign: "top" };

export async function StudentTimetable({ userId }: { userId: string }) {
  const now = new Date();
  const until = new Date(now.getTime() + 14 * 86_400_000);
  const sessions = await prisma.liveSession.findMany({
    where: { AND: [studentSessionWhere(userId), { startsAt: { gte: new Date(now.getTime() - 6 * 3_600_000), lte: until } }] },
    orderBy: { startsAt: "asc" },
    take: 120,
    include: {
      instructor: { select: { nameAr: true } },
      course: { select: { titleAr: true, instructor: { select: { nameAr: true } } } },
    },
  });

  const dayFmt = new Intl.DateTimeFormat("ar-QA", { timeZone: SITE_TZ, weekday: "long", day: "numeric", month: "long" });
  const timeFmt = new Intl.DateTimeFormat("ar-QA", { timeZone: SITE_TZ, hour: "2-digit", minute: "2-digit" });
  const days = new Map<string, typeof sessions>();
  for (const s of sessions) {
    const end = s.endsAt ?? new Date(s.startsAt.getTime() + s.durationMin * 60000);
    if (end < now) continue;
    const key = dayFmt.format(s.startsAt);
    days.set(key, [...(days.get(key) ?? []), s]);
  }

  return (
    <section className="container" style={{ paddingTop: 24 }}>
      <h1>جدول محاضراتي</h1>
      <p>محاضرات الأسبوعين القادمين، بتوقيت الكلية.</p>
      {!days.size && <p>لا توجد محاضرات مجدولة لك في الأسبوعين القادمين.</p>}
      {[...days.entries()].map(([day, list]) => (
        <article key={day} className="info-card" style={{ marginBlock: 14, padding: 16, background: "white", borderRadius: 12, overflowX: "auto" }}>
          <h2 style={{ marginTop: 0, fontSize: 19 }}>{day}</h2>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 520 }}>
            <thead><tr style={{ background: "#f7f3eb" }}><th style={cell}>الوقت</th><th style={cell}>المادة</th><th style={cell}>المحاضرة</th><th style={cell}>الأستاذ</th><th style={cell}>المدة</th><th style={cell}>الدخول</th></tr></thead>
            <tbody>{list.map((s) => {
              const end = s.endsAt ?? new Date(s.startsAt.getTime() + s.durationMin * 60000);
              const live = now.getTime() >= s.startsAt.getTime() - 15 * 60000 && now <= end;
              const teacher = s.instructor?.nameAr ?? s.course?.instructor?.nameAr ?? "—";
              return (
                <tr key={s.id}>
                  <td style={cell}>{timeFmt.format(s.startsAt)} – {timeFmt.format(end)}</td>
                  <td style={cell}>{s.course?.titleAr ?? "محاضرة عامة"}</td>
                  <td style={cell}>{s.titleAr}</td>
                  <td style={cell}>{teacher}</td>
                  <td style={cell}>{s.durationMin} دقيقة</td>
                  <td style={cell}>{live && s.joinUrl && /^https?:\/\//i.test(s.joinUrl) ? <a className="btn btn-gold" href={s.joinUrl} target="_blank" rel="noreferrer">دخول الآن</a> : live ? "مباشر" : "—"}</td>
                </tr>
              );
            })}</tbody>
          </table>
        </article>
      ))}
    </section>
  );
}
