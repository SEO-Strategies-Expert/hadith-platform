import { requireInstructor } from "@/lib/instructor";
import { AttendanceRegister } from "@/components/site/AttendanceRegister";
export default async function Page() { const me=await requireInstructor(); return me.scholarId ? <AttendanceRegister userId={me.id} scholarId={me.scholarId} /> : <p>اطلب ربط حسابك بملف الهيئة العلمية من الإدارة.</p>; }
