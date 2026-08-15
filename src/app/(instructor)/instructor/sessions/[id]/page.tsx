import Link from "next/link";
import { notFound } from "next/navigation";
import { Users } from "lucide-react";
import { requireInstructor, getInstructorSession } from "@/lib/instructor";
import { PageHeader, Card, Badge, EmptyState } from "@/components/admin/ui";
import { formatDateTime } from "@/components/admin/datetime";
import { StartSessionCard } from "@/components/instructor/StartSessionCard";

export default async function InstructorSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await requireInstructor();
  const { id } = await params;

  if (!me.scholarId) notFound();

  // العزل: المعرّف من الرابط **مع** `instructorId = scholarId` في نفس الاستعلام.
  // هذا ما يمنع محاضرًا من فتح مجلس زميله بتخمين المعرّف — ومعه رابط مضيفه.
  const s = await getInstructorSession(me.scholarId, id);
  if (!s) notFound();

  // `live` و`ended` تُحسبان في طبقة القراءة — الساعة لا تُقرأ داخل الرسم.
  const { live, ended } = s;
  const present = s.attendance.filter((a) => a.present).length;

  return (
    <div>
      <PageHeader title={s.titleAr} desc={s.descAr ?? undefined} />

      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href="/instructor/sessions"
          className="rounded-lg border border-black/10 bg-white px-3.5 py-2 text-[12.5px] font-bold text-navy-700 hover:border-gold/50"
        >
          كل مجالسي ←
        </Link>
        {s.course && (
          <Link
            href={`/instructor/courses/${s.course.id}`}
            className="rounded-lg border border-black/10 bg-white px-3.5 py-2 text-[12.5px] font-bold text-navy-700 hover:border-gold/50"
          >
            مقرّر: {s.course.titleAr} ←
          </Link>
        )}
      </div>

      <Card className="mb-5 p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {live && <Badge tone="red">مباشر الآن</Badge>}
          {s.isPublic && <Badge tone="blue">مجلس عامّ</Badge>}
          {!s.visible && <Badge tone="gray">مخفي</Badge>}
          <span className="text-[13px] font-bold text-navy-800">
            {formatDateTime(s.startsAt)} — {s.durationMin} دقيقة
          </span>
        </div>

        {/* رابط المضيف يظهر هنا لصاحب المجلس وحده (الاستعلام مصفّى بملكيّته). */}
        <StartSessionCard
          zoomStartUrl={s.zoomStartUrl}
          joinUrl={s.joinUrl}
          passcode={s.passcode}
        />

        {s.recordingUrl && (
          <div className="mt-4 rounded-xl border border-black/5 bg-cream-50 px-4 py-3 text-[12.5px]">
            <b className="text-navy-900">تسجيل المجلس:</b>{" "}
            <a
              href={s.recordingUrl}
              target="_blank"
              rel="noreferrer"
              className="font-bold text-gold-3 underline"
            >
              فتح التسجيل
            </a>
            {s.recordingPasscode && (
              <span className="text-ink-soft">
                {" "}— كلمة مرور التسجيل: <span dir="ltr">{s.recordingPasscode}</span>
              </span>
            )}
          </div>
        )}
      </Card>

      <h2 className="mb-3 flex items-center gap-2 text-[16px] font-extrabold text-navy-900">
        <Users size={17} /> الحضور ({present} من {s.attendance.length})
      </h2>
      <Card>
        {s.attendance.length === 0 ? (
          <EmptyState
            label={
              ended
                ? "لا سجلّ حضور لهذا المجلس. تُملأ السجلّات من تقرير Zoom بعد انتهائه، أو يدويًّا من لوحة الإدارة."
                : "يظهر الحضور بعد انعقاد المجلس."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-[13.5px]">
              <thead>
                <tr className="border-b border-black/5 text-[12px] text-ink-soft">
                  <th className="px-4 py-3 font-bold">الطالب</th>
                  <th className="px-4 py-3 font-bold">دخل</th>
                  <th className="px-4 py-3 font-bold">خرج</th>
                  <th className="px-4 py-3 font-bold">الدقائق</th>
                  <th className="px-4 py-3 font-bold">الحالة</th>
                  <th className="px-4 py-3 font-bold">المصدر</th>
                </tr>
              </thead>
              <tbody>
                {s.attendance.map((a) => (
                  <tr key={a.id} className="border-b border-black/5 last:border-0 hover:bg-cream-50">
                    <td className="px-4 py-3">
                      <div className="font-bold text-navy-900">{a.user.name}</div>
                      <div className="text-[12px] text-ink-soft" dir="ltr">{a.user.email}</div>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{formatDateTime(a.joinedAt)}</td>
                    <td className="px-4 py-3 text-ink-soft">{formatDateTime(a.leftAt)}</td>
                    <td className="px-4 py-3 text-ink-soft">{a.minutes}</td>
                    <td className="px-4 py-3">
                      <Badge tone={a.present ? "green" : "red"}>{a.present ? "حاضر" : "غائب"}</Badge>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-ink-soft">
                      {a.source === "zoom" ? "Zoom" : "يدوي"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
