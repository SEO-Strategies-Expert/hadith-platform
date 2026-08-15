/**
 * مهمّة تذكير الطلاب بمواعيد المجالس.
 *
 * Vercel Cron ينادي المسار بـ**GET** وفق جدول `vercel.json`، ويُرفق ترويسة
 * `Authorization: Bearer ${CRON_SECRET}` تلقائيًّا متى وُجد المتغيّر في المشروع.
 *
 * الحماية بالسرّ لا بالجلسة: مسار `api` مستثنًى من matcher في `proxy.ts`،
 * فلا حارس أمامه. وإن غاب `CRON_SECRET` في الإنتاج **نرفض بـ401** بدل فتح
 * المسار للعالم — استدعاؤه يكتب في قاعدة البيانات ويُرسل بريدًا للطلاب،
 * فتركُه مكشوفًا يعني أن أي زائر يستطيع إغراق الصندوق أو حرقَ التذكيرات.
 * الاستثناء الوحيد التطوير المحلّي، حتى يمكن تجربة المهمّة بلا ضبط أسرار.
 *
 * تشغيل يدوي للاختبار:
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://<النطاق>/api/cron/lecture-reminders
 */
import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { sendDueReminders } from "@/lib/reminders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** دفعة كبيرة من الطلاب قد تتجاوز المهلة الافتراضيّة القصيرة. */
export const maxDuration = 60;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "CRON_SECRET غير مضبوط" }, { status: 401 });
    }
  } else if (!matches(req.headers.get("authorization"), `Bearer ${secret}`)) {
    return NextResponse.json({ error: "غير مصرَّح" }, { status: 401 });
  }

  try {
    const summary = await sendDueReminders();
    console.info(
      `[cron/lecture-reminders] مجالس: ${summary.sessions} — رسائل: ${summary.emails} — فشل: ${summary.failed}`
    );
    return NextResponse.json({ ok: true, ...summary });
  } catch (e) {
    console.error("[cron/lecture-reminders] فشل التشغيل:", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

/** مقارنة ثابتة الزمن — لا نُسرّب طول السرّ ولا بادئته عبر فروق التوقيت. */
function matches(received: string | null, expected: string): boolean {
  if (!received) return false;
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
