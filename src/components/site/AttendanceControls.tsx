"use client";
import { useActionState } from "react";
import { recordAttendance } from "@/app/attendance-actions";
export function AttendanceControls({ sessionId, teacher, present, closed }: { sessionId: string; teacher: boolean; present?: boolean; closed?: boolean }) {
  const [message, action, pending] = useActionState(recordAttendance, undefined);
  const buttonStyle = { background: "#D9A12E", color: "#061A33", padding: "10px 16px", borderRadius: 10, margin: "8px 4px", fontWeight: 700, cursor: "pointer" };
  return <form action={action}><input type="hidden" name="sessionId" value={sessionId} />
    {present === undefined ? <><button style={buttonStyle} className="btn btn-gold" name="mode" value="in" disabled={pending}>✓ تسجيل الحضور</button>{!teacher && <button style={buttonStyle} className="btn btn-outline-ink" name="mode" value="absent" disabled={pending}>تسجيل الغياب</button>}</> : present && !closed ? <button style={buttonStyle} className="btn btn-gold" name="mode" value="out" disabled={pending}>تسجيل الانصراف</button> : <span>{present ? "اكتمل تسجيل الحضور" : "مسجل غائب"}</span>}
    {message && <p role="status">{message}</p>}
  </form>;
}
