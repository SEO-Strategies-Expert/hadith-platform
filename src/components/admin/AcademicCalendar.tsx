"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ChevronLeft, Loader2, Move, Pencil, X } from "lucide-react";
import { moveCalendarEntry } from "@/app/(admin)/admin/calendar/actions";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { deleteRecord } from "@/lib/crud-actions";

type Entry = { id: string; title: string; kind: string; visible: boolean; start: string; end: string | null };
const colors: Record<string, string> = { event: "border-blue-200 bg-blue-50 text-blue-900", exam: "border-purple-200 bg-purple-50 text-purple-900", deadline: "border-amber-200 bg-amber-50 text-amber-900", holiday: "border-emerald-200 bg-emerald-50 text-emerald-900" };
const labels: Record<string, string> = { event: "فعالية", exam: "اختبار", deadline: "موعد نهائي", holiday: "إجازة" };

export function AcademicCalendar({ month, entries, canEdit }: { month: string; entries: Entry[]; canEdit: boolean }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [message, setMessage] = useState<{ error?: string; success?: string }>({});
  const [pending, startTransition] = useTransition();
  const year = Number(month.slice(0, 4));
  const index = Number(month.slice(5)) - 1;
  const first = new Date(Date.UTC(year, index, 1));
  const firstDay = first.getUTCDay();
  const days = Array.from({ length: 42 }, (_, n) => new Date(Date.UTC(year, index, 1 - firstDay + n)).toISOString().slice(0, 10));
  const previous = new Date(Date.UTC(year, index - 1, 1)).toISOString().slice(0, 7);
  const next = new Date(Date.UTC(year, index + 1, 1)).toISOString().slice(0, 7);
  const title = new Intl.DateTimeFormat("ar", { month: "long", year: "numeric", timeZone: "UTC" }).format(first);
  const selectedEntry = entries.find(entry => entry.id === selected);

  function move(id: string, day: string) {
    if (!canEdit || pending || !entries.some(entry => entry.id === id)) return;
    setMessage({});
    startTransition(async () => {
      try {
        const result = await moveCalendarEntry(id, day);
        setMessage(result);
        if (result.success) { setSelected(null); router.refresh(); }
      } catch { setMessage({ error: "تعذر حفظ الموعد. أعد المحاولة." }); }
      setOver(null);
    });
  }

  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-extrabold text-navy-900">{title}</h2>
      <div className="flex items-center gap-2"><Link href={`/admin/calendar?month=${previous}`} aria-label="الشهر السابق" className="rounded-lg border border-black/10 p-2 text-navy-800"><ChevronRight size={18} /></Link><Link href="/admin/calendar" className="rounded-lg border border-black/10 px-3 py-2 text-[12px] font-bold text-navy-800">الشهر الحالي</Link><Link href={`/admin/calendar?month=${next}`} aria-label="الشهر التالي" className="rounded-lg border border-black/10 p-2 text-navy-800"><ChevronLeft size={18} /></Link></div>
    </div>
    {canEdit && <p className="text-[12.5px] leading-6 text-ink-soft">اسحب الموعد إلى يوم جديد لحفظه. على الهاتف أو بلوحة المفاتيح اضغط «نقل» في الموعد، ثم اختر رقم اليوم. يبقى وقت البداية ومدة الموعد محفوظين.</p>}
    {selectedEntry && <div className="flex items-center justify-between gap-3 rounded-xl border border-gold/30 bg-gold/10 p-3 text-[13px] font-bold text-navy-900"><span>نقل «{selectedEntry.title}»: اختر اليوم الجديد.</span><button type="button" aria-label="إلغاء النقل" onClick={() => setSelected(null)}><X size={18} /></button></div>}
    {pending && <p role="status" className="flex items-center gap-2 text-[13px] font-bold text-navy-800"><Loader2 size={16} className="animate-spin" />جارٍ حفظ الموعد…</p>}
    {message.error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-[13px] font-bold text-red-700">{message.error}</p>}
    {message.success && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-[13px] font-bold text-emerald-700">{message.success}</p>}
    <div className="overflow-x-auto rounded-2xl border border-black/10 bg-white shadow-sm" aria-busy={pending}>
      <div className="min-w-[840px]">
        <div className="grid grid-cols-7 bg-navy-800 text-center text-[12px] font-bold text-white">{["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"].map(day => <div key={day} className="p-3">{day}</div>)}</div>
        <div className="grid grid-cols-7">{days.map(day => <div key={day} className={`min-h-36 border-b border-l border-black/5 p-2 ${day.startsWith(month) ? "bg-white" : "bg-slate-50"} ${over === day ? "ring-2 ring-inset ring-gold" : ""}`} onDragOver={event => { if (canEdit && !pending) { event.preventDefault(); event.dataTransfer.dropEffect = "move"; setOver(day); } }} onDragLeave={() => setOver(null)} onDrop={event => { event.preventDefault(); move(event.dataTransfer.getData("text/plain"), day); }}>
          <button type="button" disabled={!canEdit || !selected || pending} onClick={() => selected && move(selected, day)} aria-label={`نقل الموعد إلى ${day}`} className={`mb-2 rounded-lg px-2 py-1 text-[12px] font-bold ${selected ? "bg-gold/20 text-navy-900 hover:bg-gold/40" : day.startsWith(month) ? "text-navy-900" : "text-ink-soft"}`}>{Number(day.slice(-2))}</button>
          <div className="space-y-2">{entries.filter(entry => entry.start.slice(0, 10) <= day && (entry.end?.slice(0, 10) ?? entry.start.slice(0, 10)) >= day).map(entry => <article key={entry.id} draggable={canEdit && !pending} onDragStart={event => { event.dataTransfer.setData("text/plain", entry.id); event.dataTransfer.effectAllowed = "move"; setSelected(entry.id); }} onDragEnd={() => setOver(null)} className={`rounded-lg border p-2 text-[11px] ${colors[entry.kind] ?? colors.event} ${canEdit ? "cursor-grab active:cursor-grabbing" : ""} ${selected === entry.id ? "ring-2 ring-gold" : ""}`}>
            <p className="break-words font-extrabold leading-5">{entry.title}</p>
            <p className="mt-1 text-[10px]">{labels[entry.kind] ?? entry.kind} · <span dir="ltr">{entry.start.slice(11)}</span>{!entry.visible && " · مخفي"}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Link href={`/admin/calendar/${entry.id}`} className="inline-flex items-center gap-1 font-bold underline"><Pencil size={11} />تعديل</Link>
              {canEdit && <button type="button" disabled={pending} onClick={() => { setSelected(entry.id); setMessage({}); }} className="inline-flex items-center gap-1 font-bold underline"><Move size={11} />نقل</button>}
              {canEdit && <DeleteButton action={deleteRecord.bind(null, "calendar", entry.id)} confirm="حذف هذا الموعد من التقويم؟" />}
            </div>
          </article>)}</div>
        </div>)}</div>
      </div>
    </div>
    {!entries.length && <p className="text-center text-[13px] text-ink-soft">لا توجد مواعيد في هذا الشهر. استخدم «إضافة موعد» لإضافتها إلى التقويم.</p>}
  </div>;
}
