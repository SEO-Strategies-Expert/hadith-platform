import Link from "next/link";
import { ArrowLeft, BellRing } from "lucide-react";
import { requireInstructor, getInstructorSessions } from "@/lib/instructor";
import { PageHeader, Card, Badge, EmptyState } from "@/components/admin/ui";
import { formatDateTime, SITE_TZ } from "@/components/admin/datetime";
import { NoScholarNotice } from "@/components/instructor/NoScholarNotice";
import { StartSessionCard } from "@/components/instructor/StartSessionCard";

type Row = Awaited<ReturnType<typeof getInstructorSessions>>["upcoming"][number];

function SessionRow({ s }: { s: Row }) {
  return (
    <div className="border-b border-black/5 px-4 py-4 last:border-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <b className="text-[15px] font-extrabold text-navy-900">{s.titleAr}</b>
            {s.live && <Badge tone="red">مباشر الآن</Badge>}
            {s.isPublic && <Badge tone="blue">عامّ</Badge>}
            {!s.visible && <Badge tone="gray">مخفي</Badge>}
            {s.recordingUrl && <Badge tone="gold">مسجَّل</Badge>}
          </div>
          <div className="mt-1 text-[12.5px] text-ink-soft">
            {formatDateTime(s.startsAt)} — {s.durationMin} دقيقة
            {s.course ? ` — ${s.course.titleAr}` : s.stage ? ` — ${s.stage.titleAr}` : ""}
          </div>
        </div>

        <Link
          href={`/instructor/sessions/${s.id}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 bg-white px-3.5 py-2 text-[12.5px] font-bold text-navy-800 hover:border-gold/50"
        >
          التفاصيل والحضور ({s._count.attendance}) <ArrowLeft size={14} />
        </Link>
      </div>
    </div>
  );
}

export default async function InstructorSessionsPage() {
  const me = await requireInstructor();

  if (!me.scholarId) {
    return (
      <div>
        <PageHeader title="مجالسي" />
        <NoScholarNotice />
      </div>
    );
  }

  // العزل: `instructorId = scholarId` داخل الاستعلام.
  const { upcoming, past } = await getInstructorSessions(me.scholarId);

  // أوّل مجلسٍ مباشر الآن يستحقّ زرّ البدء في أعلى الشاشة — هذه لحظة استعماله.
  const liveOne = upcoming.find((s) => s.live);

  return (
    <div>
      <PageHeader
        title="مجالسي"
        desc={`المجالس المسنَدة إليك. المواعيد بتوقيت ${SITE_TZ}.`}
      />

      {liveOne && (
        <Card className="mb-5 p-5">
          <div className="mb-3">
            <Badge tone="red">مباشر الآن</Badge>
            <b className="mt-2 block text-[16px] font-extrabold text-navy-900">{liveOne.titleAr}</b>
            <div className="text-[12.5px] text-ink-soft">{formatDateTime(liveOne.startsAt)}</div>
          </div>
          {/* المجلس من استعلامٍ مصفّى بـ`scholarId` — فرابط المضيف لصاحبه قطعًا. */}
          <StartSessionCard
            zoomStartUrl={liveOne.zoomStartUrl}
            joinUrl={liveOne.joinUrl}
            passcode={liveOne.passcode}
          />
        </Card>
      )}

      <h2 className="mb-3 flex items-center gap-2 text-[16px] font-extrabold text-navy-900">
        <BellRing size={17} /> المجالس القادمة
      </h2>
      <Card>
        {upcoming.length === 0 ? (
          <EmptyState label="لا مجالس قادمة مسنَدة إليك." />
        ) : (
          upcoming.map((s) => <SessionRow key={s.id} s={s} />)
        )}
      </Card>

      {past.length > 0 && (
        <>
          <h2 className="mb-3 mt-8 text-[16px] font-extrabold text-navy-900">مجالس منتهية</h2>
          <Card>
            {past.map((s) => (
              <SessionRow key={s.id} s={s} />
            ))}
          </Card>
        </>
      )}
    </div>
  );
}
