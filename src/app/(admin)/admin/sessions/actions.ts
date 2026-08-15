"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { isZoomConfigured, createMeeting, updateMeeting, deleteMeeting } from "@/lib/zoom";
import { fromLocalInput } from "@/components/admin/datetime";

/**
 * إجراءات المجالس المباشرة.
 *
 * قاعدة التعامل مع Zoom هنا: **لا يُسقط فشلُ Zoom حفظَ المجلس**. نحفظ السجلّ
 * أوّلًا ثم نحاول إنشاء المجلس، فإن تعذّر (مفاتيح ناقصة، حصّة، انقطاع) بقي عمل
 * المحرّر محفوظًا ويكمل يدويًّا بلصق رابط الانضمام.
 */

const schema = z.object({
  titleAr: z.string().trim().min(1, "عنوان المجلس بالعربية مطلوب"),
  titleEn: z.string().trim().min(1, "عنوان المجلس بالإنجليزية مطلوب"),
  descAr: z.string().optional(),
  descEn: z.string().optional(),
  courseId: z.string().optional(),
  stageId: z.string().optional(),
  instructorId: z.string().optional(),
  provider: z.string().optional(),
  startsAt: z.string().trim().min(1, "موعد بداية المجلس مطلوب"),
});

function optionalText(v: unknown): string | null {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
}

function build(formData: FormData) {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };

  const startsAt = fromLocalInput(parsed.data.startsAt);
  if (!startsAt) return { ok: false as const, error: "موعد البداية غير صحيح." };

  const durationRaw = Number(String(formData.get("durationMin") ?? "").trim());
  const durationMin = Number.isFinite(durationRaw) && durationRaw > 0 ? Math.round(durationRaw) : 90;

  return {
    ok: true as const,
    data: {
      titleAr: parsed.data.titleAr,
      titleEn: parsed.data.titleEn,
      descAr: optionalText(parsed.data.descAr),
      descEn: optionalText(parsed.data.descEn),
      courseId: optionalText(parsed.data.courseId),
      stageId: optionalText(parsed.data.stageId),
      instructorId: optionalText(parsed.data.instructorId),
      provider: optionalText(parsed.data.provider) ?? "zoom",
      startsAt,
      // نشتقّ النهاية من المدّة لتُستعمل في حساب «مباشر الآن» بلا حقل إضافي.
      endsAt: new Date(startsAt.getTime() + durationMin * 60_000),
      durationMin,
      joinUrl: optionalText(formData.get("joinUrl")),
      passcode: optionalText(formData.get("passcode")),
      recordingUrl: optionalText(formData.get("recordingUrl")),
      isPublic: formData.get("isPublic") === "on",
      visible: formData.get("visible") === "on",
    },
  };
}

/** ينشئ المجلس على Zoom ويحفظ معرّفه وروابطه. يرجع false إن تعذّر. */
async function attachZoomMeeting(sessionId: string): Promise<boolean> {
  if (!isZoomConfigured()) return false;
  const s = await prisma.liveSession.findUnique({ where: { id: sessionId } });
  if (!s || s.zoomMeetingId) return false;
  try {
    const meeting = await createMeeting({
      topic: s.titleAr,
      startsAt: s.startsAt,
      durationMin: s.durationMin,
      agenda: s.descAr ?? undefined,
    });
    await prisma.liveSession.update({
      where: { id: sessionId },
      data: {
        provider: "zoom",
        zoomMeetingId: meeting.meetingId,
        zoomStartUrl: meeting.startUrl,
        joinUrl: meeting.joinUrl,
        passcode: meeting.passcode ?? s.passcode,
      },
    });
    return true;
  } catch (e) {
    console.error("[sessions] تعذّر إنشاء مجلس Zoom", e);
    return false;
  }
}

export async function createSession(
  _prev: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  await requireUser();
  const r = build(formData);
  if (!r.ok) return r.error;

  const created = await prisma.liveSession.create({ data: r.data });

  const wantsZoom = formData.get("autoZoom") === "on" && isZoomConfigured();
  if (wantsZoom) {
    const ok = await attachZoomMeeting(created.id);
    revalidatePath("/admin/sessions");
    // نأخذه إلى شاشة التعديل ليرى رابط المضيف السرّي أو سبب الإخفاق.
    redirect(`/admin/sessions/${created.id}?zoom=${ok ? "ok" : "failed"}`);
  }

  revalidatePath("/admin/sessions");
  redirect("/admin/sessions");
}

export async function updateSession(
  id: string,
  _prev: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  await requireUser();
  const r = build(formData);
  if (!r.ok) return r.error;

  const before = await prisma.liveSession.findUnique({ where: { id } });
  if (!before) return "المجلس غير موجود.";

  await prisma.liveSession.update({ where: { id }, data: r.data });

  // مزامنة الموعد والعنوان مع Zoom إن كان المجلس منشأً هناك — بأفضل جهد.
  if (before.zoomMeetingId && isZoomConfigured()) {
    try {
      await updateMeeting(before.zoomMeetingId, {
        topic: r.data.titleAr,
        startsAt: r.data.startsAt,
        durationMin: r.data.durationMin,
        agenda: r.data.descAr ?? undefined,
      });
    } catch (e) {
      console.error("[sessions] تعذّرت مزامنة المجلس مع Zoom", e);
    }
  }

  if (!before.zoomMeetingId && formData.get("autoZoom") === "on" && isZoomConfigured()) {
    const ok = await attachZoomMeeting(id);
    revalidatePath("/admin/sessions");
    redirect(`/admin/sessions/${id}?zoom=${ok ? "ok" : "failed"}`);
  }

  revalidatePath("/admin/sessions");
  redirect("/admin/sessions");
}

export async function deleteSession(id: string) {
  await requireUser();
  const s = await prisma.liveSession.findUnique({ where: { id }, select: { zoomMeetingId: true } });
  if (s?.zoomMeetingId && isZoomConfigured()) {
    try {
      await deleteMeeting(s.zoomMeetingId);
    } catch (e) {
      // مجلس محذوف من Zoom مسبقًا أو خطأ شبكة — لا نمنع حذف السجلّ لأجله.
      console.error("[sessions] تعذّر حذف المجلس من Zoom", e);
    }
  }
  await prisma.liveSession.delete({ where: { id } });
  revalidatePath("/admin/sessions");
}
