"use client";

import { useActionState, useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { manageStudentAttendance } from "@/app/(instructor)/instructor/attendance/actions";

const fieldClass = "w-full min-w-0 rounded-lg border border-black/10 bg-white px-3 py-2 text-[12px] outline-none focus:border-gold focus:ring-2 focus:ring-gold/15";

export function StudentAttendanceEditor({ sessionId, userId, studentName, record }: {
  sessionId: string;
  userId: string;
  studentName: string;
  record: { exists: boolean; present: boolean; joinedAt: string; leftAt: string; note: string };
}) {
  const [state, action, pending] = useActionState(manageStudentAttendance, {});
  const [status, setStatus] = useState(record.present ? "present" : "absent");
  return (
    <details className="min-w-48 max-w-sm">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-lg border border-black/10 bg-white px-3 py-2 text-[12px] font-bold text-navy-800 hover:bg-slate-50">
        {record.exists ? <Pencil size={14} /> : <Plus size={14} />}{record.exists ? "تعديل الحضور" : "إضافة حضور / غياب"}
      </summary>
      <form action={action} className="mt-3 min-w-64 space-y-3 rounded-xl border border-black/10 bg-slate-50 p-3" onSubmit={event => {
        const button = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        if (button?.value === "delete" && !window.confirm(`حذف سجل حضور ${studentName} لهذه المحاضرة؟`)) event.preventDefault();
      }}>
        <input type="hidden" name="sessionId" value={sessionId} />
        <input type="hidden" name="userId" value={userId} />
        <label className="block text-[12px] font-bold text-navy-900">الحالة<select name="status" value={status} onChange={event => setStatus(event.target.value)} className={`mt-1 ${fieldClass}`}><option value="present">حاضر</option><option value="absent">غائب</option></select></label>
        <div className={status === "absent" ? "hidden" : "space-y-3"}>
          <label className="block text-[12px] font-bold text-navy-900">وقت الحضور<input type="datetime-local" name="joinedAt" defaultValue={record.joinedAt} dir="ltr" className={`mt-1 ${fieldClass}`} /></label>
          <label className="block text-[12px] font-bold text-navy-900">وقت الانصراف<input type="datetime-local" name="leftAt" defaultValue={record.leftAt} dir="ltr" className={`mt-1 ${fieldClass}`} /></label>
          <p className="text-[11px] leading-5 text-ink-soft">تُحسب الدقائق تلقائيًا ضمن مدة المحاضرة. اترك الانصراف فارغًا إذا لم ينصرف الطالب بعد.</p>
        </div>
        <label className="block text-[12px] font-bold text-navy-900">ملاحظات<textarea name="note" rows={2} maxLength={191} defaultValue={record.note} className={`mt-1 ${fieldClass}`} /></label>
        {state.error && <p role="alert" className="text-[12px] font-bold text-red-700">{state.error}</p>}
        {state.success && <p role="status" className="text-[12px] font-bold text-emerald-700">{state.success}</p>}
        <div className="flex flex-wrap items-center gap-2 border-t border-black/5 pt-3">
          <button type="submit" name="mode" value="save" disabled={pending} className="inline-flex items-center gap-1.5 rounded-lg bg-navy-800 px-3 py-2 text-[12px] font-bold text-white disabled:opacity-50">{pending && <Loader2 size={14} className="animate-spin" />}حفظ</button>
          {record.exists && <button type="submit" name="mode" value="delete" disabled={pending} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-[12px] font-bold text-red-700 disabled:opacity-50"><Trash2 size={14} />حذف السجل</button>}
        </div>
      </form>
    </details>
  );
}
