import Link from "next/link";
import { Pencil, Video, BellRing } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { isZoomConfigured } from "@/lib/zoom";
import { PageHeader, Card, Badge, EmptyState } from "@/components/admin/ui";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { formatDateTime, SITE_TZ } from "@/components/admin/datetime";
import { SESSION_PROVIDERS } from "./fields";
import { deleteSession } from "./actions";

/* eslint-disable @typescript-eslint/no-explicit-any */

function providerLabel(v: string) {
  return SESSION_PROVIDERS.find((p) => p.value === v)?.label ?? v;
}

function SessionsTable({ rows }: { rows: any[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-right text-[13.5px]">
        <thead>
          <tr className="border-b border-black/5 text-[12px] text-ink-soft">
            <th className="px-4 py-3 font-bold">المجلس</th>
            <th className="px-4 py-3 font-bold">الموعد</th>
            <th className="px-4 py-3 font-bold">الارتباط</th>
            <th className="px-4 py-3 font-bold">المحاضر</th>
            <th className="px-4 py-3 font-bold">المنصّة</th>
            <th className="px-4 py-3 font-bold">التذكيرات</th>
            <th className="px-4 py-3 font-bold">الحالة</th>
            <th className="px-4 py-3 font-bold">إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.id} className="border-b border-black/5 last:border-0 hover:bg-cream-50">
              <td className="px-4 py-3">
                <div className="font-bold text-navy-900">{s.titleAr}</div>
                <div className="text-[12px] text-ink-soft" dir="ltr">{s.titleEn}</div>
              </td>
              <td className="px-4 py-3 text-navy-800">
                <div>{formatDateTime(s.startsAt)}</div>
                <div className="text-[11.5px] text-ink-soft">{s.durationMin} دقيقة</div>
              </td>
              <td className="px-4 py-3 text-navy-800">
                {s.course?.titleAr ?? s.stage?.titleAr ?? (s.isPublic ? "مجلس عامّ" : "—")}
              </td>
              <td className="px-4 py-3 text-navy-800">{s.instructor?.nameAr ?? "—"}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-1">
                  <Badge tone="gold">{providerLabel(s.provider)}</Badge>
                  {s.zoomMeetingId ? (
                    <Badge tone="blue">Zoom مُنشأ</Badge>
                  ) : s.joinUrl ? (
                    <Badge tone="gray">رابط يدوي</Badge>
                  ) : (
                    <Badge tone="red">بلا رابط</Badge>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-[11.5px] text-ink-soft">
                {/* للقراءة فقط — نظام التذكير هو من يختم هذه الحقول. */}
                <div>٢٤ ساعة: {s.reminder24SentAt ? formatDateTime(s.reminder24SentAt) : "لم يُرسل"}</div>
                <div>ساعة: {s.reminder1SentAt ? formatDateTime(s.reminder1SentAt) : "لم يُرسل"}</div>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-1">
                  {s.visible ? <Badge tone="green">ظاهر</Badge> : <Badge tone="gray">مخفي</Badge>}
                  {s.isPublic && <Badge tone="blue">عامّ</Badge>}
                  {s.recordingUrl && <Badge tone="gold">مسجَّل</Badge>}
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  <Link
                    href={`/admin/sessions/${s.id}`}
                    className="grid h-9 w-9 place-items-center rounded-lg text-navy-700 hover:bg-black/5"
                    title="تعديل"
                  >
                    <Pencil size={16} />
                  </Link>
                  <DeleteButton
                    action={deleteSession.bind(null, s.id)}
                    confirm="سيُحذف المجلس (ومجلس Zoom المرتبط به إن وُجد). هل أنت متأكد؟"
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * قراءة المجالس مقسومةً إلى قادمة ومنتهية.
 * خارج المكوّن عمدًا: قراءة الساعة أثر جانبيّ لا يجوز في جسم مكوّن React.
 */
async function loadSessions() {
  const sessions = await prisma.liveSession.findMany({
    orderBy: { startsAt: "asc" },
    include: {
      course: { select: { titleAr: true } },
      stage: { select: { titleAr: true } },
      instructor: { select: { nameAr: true } },
    },
  });

  // المجلس يبقى «قادمًا» ساعةً بعد بدايته حتى لا يختفي أثناء انعقاده.
  const cutoff = Date.now() - 60 * 60_000;
  return {
    upcoming: sessions.filter((s) => s.startsAt.getTime() >= cutoff),
    past: sessions.filter((s) => s.startsAt.getTime() < cutoff).reverse(),
  };
}

export default async function SessionsPage() {
  await requireUser();

  const { upcoming, past } = await loadSessions();
  const zoomReady = isZoomConfigured();

  return (
    <div>
      <PageHeader
        title="المجالس المباشرة"
        desc="محاضرات ومجالس السماع. يراها الطالب في بوابته حسب مقرّراته ومرحلته."
        action={{ href: "/admin/sessions/new", label: "إضافة مجلس" }}
      />

      <div
        className={`mb-5 flex items-start gap-2.5 rounded-xl border px-4 py-3 text-[12.5px] ${
          zoomReady
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : "border-amber-200 bg-amber-50 text-amber-800"
        }`}
      >
        <Video size={16} className="mt-0.5 shrink-0" />
        <p className="font-semibold leading-6">
          {zoomReady
            ? `تكامل Zoom مُفعَّل — يمكنك إنشاء مجلس تلقائيًّا عند الحفظ. المواعيد بتوقيت ${SITE_TZ}.`
            : `مفاتيح Zoom غير مضبوطة بعد — الوضع اليدوي: الصق رابط الانضمام في حقل «رابط انضمام الطلاب». المواعيد بتوقيت ${SITE_TZ}.`}
        </p>
      </div>

      <h2 className="mb-3 flex items-center gap-2 text-[16px] font-extrabold text-navy-900">
        <BellRing size={17} /> المجالس القادمة
      </h2>
      <Card>
        {upcoming.length === 0 ? (
          <EmptyState label="لا مجالس قادمة. اضغط «إضافة مجلس»." />
        ) : (
          <SessionsTable rows={upcoming} />
        )}
      </Card>

      {past.length > 0 && (
        <>
          <h2 className="mb-3 mt-8 text-[16px] font-extrabold text-navy-900">مجالس منتهية</h2>
          <Card>
            <SessionsTable rows={past} />
          </Card>
        </>
      )}
    </div>
  );
}
