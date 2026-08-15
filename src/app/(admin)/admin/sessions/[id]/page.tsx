import { notFound } from "next/navigation";
import { ShieldAlert, Info } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { isZoomConfigured } from "@/lib/zoom";
import { PageHeader, Card, Checkbox } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { ResourceFields } from "@/components/admin/ResourceFields";
import { withRelationOptions } from "@/lib/resource-options";
import { formatDateTime } from "@/components/admin/datetime";
import { sessionFields } from "../fields";
import { updateSession } from "../actions";

function ReadOnlyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-black/5 py-2 last:border-0">
      <span className="text-[12.5px] font-bold text-navy-800">{label}</span>
      <span className="text-[12.5px] text-ink-soft" dir="auto">{value}</span>
    </div>
  );
}

export default async function EditSessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ zoom?: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const { zoom } = await searchParams;

  const session = await prisma.liveSession.findUnique({ where: { id } });
  if (!session) notFound();

  const fields = await withRelationOptions(sessionFields);
  const zoomReady = isZoomConfigured();

  return (
    <div>
      <PageHeader title="تعديل المجلس" desc={session.titleAr} />

      {zoom === "ok" && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] font-semibold text-emerald-800">
          أُنشئ مجلس Zoom بنجاح وامتلأ رابط الانضمام.
        </div>
      )}
      {zoom === "failed" && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-700">
          حُفظ المجلس، لكن تعذّر إنشاؤه على Zoom. الصق رابط الانضمام يدويًّا أو أعد المحاولة لاحقًا.
        </div>
      )}

      {/* رابط المضيف سرّي: يفتح المجلس بصلاحيّة المحاضر لمن يملكه. */}
      {session.zoomStartUrl && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5">
          <div className="flex items-center gap-2 text-[13px] font-extrabold text-red-700">
            <ShieldAlert size={16} /> رابط المضيف (سرّي — لا يُرسل للطلاب أبدًا)
          </div>
          <p className="mt-1.5 text-[11.5px] leading-6 text-red-700/90">
            من يفتح هذا الرابط يدخل المجلس مضيفًا بكامل الصلاحيّات. لا يُشارك إلا مع المحاضر.
          </p>
          <code
            dir="ltr"
            className="mt-2 block max-w-full overflow-x-auto rounded-lg bg-white/70 px-3 py-2 text-[11px] text-red-800"
          >
            {session.zoomStartUrl}
          </code>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="p-6">
          <ActionForm action={updateSession.bind(null, id)} cancelHref="/admin/sessions">
            <ResourceFields fields={fields} record={session} />

            {zoomReady && !session.zoomMeetingId && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5">
                <Checkbox
                  label="أنشئ مجلس Zoom تلقائيًّا عند الحفظ"
                  name="autoZoom"
                />
              </div>
            )}
            {!zoomReady && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] font-semibold leading-6 text-amber-800">
                <Info size={15} className="mt-0.5 shrink-0" />
                مفاتيح Zoom غير مضبوطة — املأ «رابط انضمام الطلاب» و«رمز الدخول» يدويًّا.
              </div>
            )}
          </ActionForm>
        </Card>

        <Card className="h-fit p-5">
          <h2 className="mb-3 text-[14px] font-extrabold text-navy-900">بيانات للقراءة فقط</h2>
          <ReadOnlyRow label="معرّف Zoom" value={session.zoomMeetingId ?? "—"} />
          <ReadOnlyRow
            label="تذكير قبل ٢٤ ساعة"
            value={session.reminder24SentAt ? formatDateTime(session.reminder24SentAt) : "لم يُرسل"}
          />
          <ReadOnlyRow
            label="تذكير قبل ساعة"
            value={session.reminder1SentAt ? formatDateTime(session.reminder1SentAt) : "لم يُرسل"}
          />
          <ReadOnlyRow
            label="جهوزيّة التسجيل"
            value={session.recordingReadyAt ? formatDateTime(session.recordingReadyAt) : "—"}
          />
          <ReadOnlyRow
            label="آخر مزامنة حضور"
            value={session.attendanceSyncedAt ? formatDateTime(session.attendanceSyncedAt) : "—"}
          />
          <p className="mt-3 text-[11.5px] leading-6 text-ink-soft">
            أوقات التذكير يختمها نظام التذكير الآلي، ولا تُحرَّر من هنا.
          </p>
        </Card>
      </div>
    </div>
  );
}
