/**
 * ويب هوك Zoom — يملأ تسجيل المجلس وحضوره تلقائيًّا.
 *
 * الأحداث المُشترَك فيها من إعدادات تطبيق Zoom:
 *   • endpoint.url_validation  — تحدّي إثبات ملكيّة الرابط (مرّة عند التفعيل)
 *   • recording.completed      — التسجيل السحابي جاهز → recordingUrl
 *   • meeting.ended            → مزامنة الحضور من تقرير المشاركين
 *
 * الرابط الذي يُسجَّل في Zoom: https://<النطاق>/api/webhooks/zoom
 *
 * ملاحظتان تشغيليّتان:
 *   • مسار `api` مستثنًى من matcher في `proxy.ts`، فالتحقّق هنا بالتوقيع لا بالجلسة.
 *   • Zoom يعتبر أي ردّ غير 2xx فشلًا ويعيد المحاولة ثم يوقف الاشتراك؛ لذا نردّ
 *     200 على الأحداث التي لا تعنينا بدل 404.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyZoomWebhook,
  zoomUrlValidation,
  getRecording,
  getParticipants,
} from "@/lib/zoom";

export const runtime = "nodejs";

export async function POST(req: Request) {
  // التوقيع يُحسب على الجسم الخامّ — لا تُحلّله قبل التحقّق.
  const raw = await req.text();

  const ok = await verifyZoomWebhook(
    raw,
    req.headers.get("x-zm-signature"),
    req.headers.get("x-zm-request-timestamp")
  );
  if (!ok) {
    return NextResponse.json({ error: "توقيع غير صالح" }, { status: 401 });
  }

  let body: { event?: string; payload?: Record<string, unknown> };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "جسم غير صالح" }, { status: 400 });
  }

  // تحدّي إثبات ملكيّة الرابط عند تفعيل الويب هوك في لوحة Zoom
  if (body.event === "endpoint.url_validation") {
    const plainToken = (body.payload as { plainToken?: string })?.plainToken;
    if (!plainToken) {
      return NextResponse.json({ error: "plainToken مفقود" }, { status: 400 });
    }
    return NextResponse.json(await zoomUrlValidation(plainToken));
  }

  const meetingId = String(
    (body.payload as { object?: { id?: string | number } })?.object?.id ?? ""
  );
  if (!meetingId) return NextResponse.json({ ok: true });

  const session = await prisma.liveSession.findUnique({ where: { zoomMeetingId: meetingId } });
  // مجلس أُنشئ على Zoom خارج المنصّة — نتجاهله بهدوء.
  if (!session) return NextResponse.json({ ok: true });

  try {
    if (body.event === "recording.completed") {
      const rec = await getRecording(meetingId);
      if (rec) {
        await prisma.liveSession.update({
          where: { id: session.id },
          data: {
            recordingUrl: rec.playUrl,
            recordingPasscode: rec.passcode ?? null,
            recordingReadyAt: new Date(),
          },
        });
      }
    } else if (body.event === "meeting.ended") {
      await syncAttendance(session.id, meetingId);
    }
  } catch (e) {
    // لا نُرجع 5xx: Zoom سيعيد الإرسال بلا فائدة إن كان الخلل عندنا.
    console.error(`[zoom-webhook] ${body.event} للمجلس ${meetingId}:`, e);
  }

  return NextResponse.json({ ok: true });
}

/**
 * يطابق مشاركي Zoom بحسابات الطلاب عبر البريد.
 * السجلّات اليدويّة (source='manual') لا تُدهَس — المحاضر قد يكون صحّح الحضور.
 */
async function syncAttendance(sessionId: string, meetingId: string) {
  const participants = await getParticipants(meetingId);
  if (!participants.length) return; // الباقة المجّانية لا تتيح التقارير

  const emails = participants.map((p) => p.email).filter((e): e is string => Boolean(e));
  if (!emails.length) return;

  const users = await prisma.user.findMany({
    where: { email: { in: emails } },
    select: { id: true, email: true },
  });
  const byEmail = new Map(users.map((u) => [u.email, u.id]));

  for (const p of participants) {
    const userId = p.email ? byEmail.get(p.email) : undefined;
    if (!userId) continue; // حاضر بلا حساب في المنصّة

    const existing = await prisma.attendance.findUnique({
      where: { userId_sessionId: { userId, sessionId } },
    });
    if (existing?.source === "manual") continue;

    const data = {
      joinedAt: new Date(p.joinedAt),
      leftAt: p.leftAt ? new Date(p.leftAt) : null,
      minutes: p.minutes,
      present: true,
      source: "zoom",
    };
    await prisma.attendance.upsert({
      where: { userId_sessionId: { userId, sessionId } },
      create: { userId, sessionId, ...data },
      update: data,
    });
  }

  await prisma.liveSession.update({
    where: { id: sessionId },
    data: { attendanceSyncedAt: new Date() },
  });
}
