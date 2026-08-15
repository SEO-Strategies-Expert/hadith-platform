/**
 * ويب هوك Calendly — يملأ موعد «المقابلة العلميّة» في طلب الالتحاق تلقائيًّا.
 *
 * الأحداث المُشترَك فيها من اشتراك الويب هوك:
 *   • invitee.created   — الطالب حجز موعدًا  → interviewAt/interviewUrl/scheduled
 *   • invitee.canceled  — أُلغي الموعد        → interviewStatus = canceled
 *
 * الرابط الذي يُسجَّل في Calendly: https://<النطاق>/api/webhooks/calendly
 *
 * ملاحظتان تشغيليّتان:
 *   • مسار `api` مستثنًى من matcher في `proxy.ts`، فالتحقّق هنا بالتوقيع لا بالجلسة.
 *   • Calendly يعيد إرسال أيّ طلبٍ لم يُجَب بـ2xx؛ فنردّ 200 على ما لا يعنينا
 *     وعلى الأخطاء التي عندنا، لئلّا تدور إعادة الإرسال بلا فائدة.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCalendlyWebhook, extractInterview, type CalendlyWebhookBody } from "@/lib/calendly";

export const runtime = "nodejs";

export async function POST(req: Request) {
  // التوقيع يُحسب على الجسم الخامّ — لا تُحلّله قبل التحقّق.
  const raw = await req.text();

  const ok = await verifyCalendlyWebhook(raw, req.headers.get("calendly-webhook-signature"));
  if (!ok) {
    return NextResponse.json({ error: "توقيع غير صالح" }, { status: 401 });
  }

  let body: CalendlyWebhookBody;
  try {
    body = JSON.parse(raw) as CalendlyWebhookBody;
  } catch {
    return NextResponse.json({ error: "جسم غير صالح" }, { status: 400 });
  }

  const event = body.event;
  if (event !== "invitee.created" && event !== "invitee.canceled") {
    return NextResponse.json({ ok: true });
  }

  const interview = extractInterview(body);
  if (!interview) {
    console.warn(`[calendly-webhook] ${event}: حمولة بلا بريد أو بلا معرّف حدث.`);
    return NextResponse.json({ ok: true });
  }

  try {
    // عدم التكرار: لا قيد تفرّد على calendlyEventUri في القاعدة (مقصود — الحقل
    // اختياري وقد يتكرّر فراغه في آلاف الطلبات). فنفرضه هنا: نبحث بالمعرّف أوّلًا،
    // فإن وُجد سجلٌّ سبق ربطه بهذا الحدث حدّثناه هو، ولم نمسّ سجلًّا آخر — وبذلك
    // تصير إعادة الإرسال من Calendly عمليّةً عديمة الأثر (idempotent).
    const linked = await prisma.admissionApplication.findFirst({
      where: { calendlyEventUri: interview.eventUri },
      orderBy: { createdAt: "desc" },
    });

    if (event === "invitee.canceled") {
      // إلغاء حدثٍ قديم قد يصل **بعد** إنشاء الحدث البديل عند إعادة الجدولة؛
      // فلا نلغي إلّا السجلّ المربوط بهذا الحدث بعينه، وإلّا مسحنا موعدًا صالحًا.
      if (!linked) {
        console.warn(`[calendly-webhook] إلغاء حدث غير مربوط بأي طلب: ${interview.eventUri}`);
        return NextResponse.json({ ok: true });
      }
      await prisma.admissionApplication.update({
        where: { id: linked.id },
        data: { interviewStatus: "canceled", interviewUrl: null },
      });
      return NextResponse.json({ ok: true });
    }

    // invitee.created — أحدث طلب التحاق ببريد المدعوّ هو المقصود: الطالب قد
    // يكون قدّم أكثر من مرّة، والمقابلة تخصّ طلبه الأخير.
    const application =
      linked ??
      (await prisma.admissionApplication.findFirst({
        where: { email: interview.email },
        orderBy: { createdAt: "desc" },
      }));

    if (!application) {
      // حجزٌ ببريدٍ لا طلبَ التحاق له — لا نفشل: قسم القبول يراه في Calendly،
      // وردّ 5xx هنا يجعل Calendly يعيد الإرسال بلا أن يتغيّر شيء.
      console.warn(`[calendly-webhook] حجز بلا طلب التحاق مطابق: ${interview.email}`);
      return NextResponse.json({ ok: true });
    }

    await prisma.admissionApplication.update({
      where: { id: application.id },
      data: {
        interviewAt: interview.startsAt,
        interviewUrl: interview.joinUrl,
        interviewStatus: "scheduled",
        calendlyEventUri: interview.eventUri,
      },
    });
  } catch (e) {
    // لا نُرجع 5xx: Calendly سيعيد الإرسال بلا فائدة إن كان الخلل عندنا.
    console.error(`[calendly-webhook] ${event} للحدث ${interview.eventUri}:`, e);
  }

  return NextResponse.json({ ok: true });
}
