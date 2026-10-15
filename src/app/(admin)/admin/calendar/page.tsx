import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { PageHeader } from "@/components/admin/ui";
import { fromLocalInput, toLocalInput, SITE_TZ } from "@/components/admin/datetime";
import { AcademicCalendar } from "@/components/admin/AcademicCalendar";

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const user = await requireUser();
  const params = await searchParams;
  const currentMonth = toLocalInput(new Date())!.slice(0, 7);
  const month = params.month && /^\d{4}-(0[1-9]|1[0-2])$/.test(params.month) && Number(params.month.slice(0, 4)) >= 1000 && Number(params.month.slice(0, 4)) < 9999 ? params.month : currentMonth;
  const year = Number(month.slice(0, 4));
  const monthIndex = Number(month.slice(5)) - 1;
  const first = new Date(Date.UTC(year, monthIndex, 1));
  const gridStart = new Date(first.getTime() - first.getUTCDay() * 86_400_000);
  const gridEnd = new Date(gridStart.getTime() + 42 * 86_400_000);
  const start = fromLocalInput(`${gridStart.toISOString().slice(0, 10)}T00:00`)!;
  const end = fromLocalInput(`${gridEnd.toISOString().slice(0, 10)}T00:00`)!;
  const entries = await prisma.academicCalendarEntry.findMany({
    where: { startsAt: { lt: end }, OR: [{ endsAt: { gte: start } }, { startsAt: { gte: start } }] },
    orderBy: [{ startsAt: "asc" }, { id: "asc" }],
  });
  return <div className="min-w-0 space-y-5">
    <PageHeader title="التقويم الأكاديمي" desc={`تنظيم المواعيد والاختبارات والإجازات. التوقيت: ${SITE_TZ}.`} action={{ href: "/admin/calendar/new", label: "إضافة موعد" }} />
    <AcademicCalendar month={month} canEdit={user.role === "ADMIN"} entries={entries.map(entry => ({
      id: entry.id, title: entry.titleAr, kind: entry.kind, visible: entry.visible,
      start: toLocalInput(entry.startsAt)!, end: toLocalInput(entry.endsAt) ?? null,
    }))} />
  </div>;
}
