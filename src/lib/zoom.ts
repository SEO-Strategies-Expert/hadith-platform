/**
 * تكامل Zoom للمجالس المباشرة.
 *
 * التصميم مقصود أن يعمل **قبل** توفّر الحساب المدفوع وبعده بلا تغيير كود:
 *   - بلا متغيّرات بيئة → `isZoomConfigured()` ترجع false، فيسقط النظام إلى
 *     الوضع اليدوي: المحرّر يلصق رابط الانضمام في `LiveSession.joinUrl`.
 *   - بمتغيّرات البيئة → تُنشأ المجالس تلقائيًّا على Zoom، ويعود رابط الانضمام
 *     ورابط البدء ورمز الدخول، ويُملأ التسجيل السحابي تلقائيًّا عبر الويب هوك.
 *
 * نوع تطبيق Zoom المطلوب: **Server-to-Server OAuth** (لا يحتاج تسجيل دخول
 * المستخدم). يُنشأ من marketplace.zoom.us → Develop → Build App.
 * الصلاحيات (scopes): meeting:write:admin, meeting:read:admin,
 * recording:read:admin, report:read:admin (الأخيرة للحضور — تتطلّب باقة مدفوعة).
 *
 * ⚠️ التضمين داخل الصفحة (Meeting SDK) تطبيقٌ **منفصل** بمفاتيح أخرى. هذا
 * الملفّ يغطّي الجدولة والتسجيل والحضور فقط؛ الانضمام عبر `joinUrl`.
 */

const TOKEN_URL = "https://zoom.us/oauth/token";
const API = "https://api.zoom.us/v2";

/** هل مفاتيح Zoom مضبوطة؟ إن لا، يعمل النظام بالوضع اليدوي. */
export function isZoomConfigured(): boolean {
  return Boolean(
    process.env.ZOOM_ACCOUNT_ID &&
      process.env.ZOOM_CLIENT_ID &&
      process.env.ZOOM_CLIENT_SECRET
  );
}

// ---------------------------------------------------------------------------
// المصادقة — رمز وصول قصير العمر مع تخزين مؤقّت في الذاكرة
// ---------------------------------------------------------------------------

let cachedToken: { value: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }
  const basic = Buffer.from(
    `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch(
    `${TOKEN_URL}?grant_type=account_credentials&account_id=${encodeURIComponent(
      process.env.ZOOM_ACCOUNT_ID!
    )}`,
    { method: "POST", headers: { Authorization: `Basic ${basic}` }, cache: "no-store" }
  );
  if (!res.ok) {
    throw new Error(`Zoom auth failed (${res.status}): ${await res.text()}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return cachedToken.value;
}

async function zoomFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await accessToken();
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Zoom ${init.method ?? "GET"} ${path} → ${res.status}: ${await res.text()}`);
  }
  // DELETE يرجع 204 بلا جسم
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

// ---------------------------------------------------------------------------
// المجالس
// ---------------------------------------------------------------------------

export interface ZoomMeeting {
  /** معرّف المجلس لدى Zoom — يُخزَّن في LiveSession.zoomMeetingId */
  meetingId: string;
  /** رابط الطلاب */
  joinUrl: string;
  /** رابط المضيف — سرّي، لا يُعرض إلا للمحاضر والمدير */
  startUrl: string;
  passcode?: string;
}

export interface CreateMeetingInput {
  topic: string;
  startsAt: Date;
  /** المدّة بالدقائق */
  durationMin?: number;
  agenda?: string;
  /** بريد مضيف المجلس؛ الافتراضي مالك الحساب */
  hostEmail?: string;
  /** التسجيل السحابي — يتطلّب باقة مدفوعة. عند الباقة المجّانية اجعلها false. */
  cloudRecording?: boolean;
}

/** إعدادات موحَّدة لكل مجالس الكلّية. */
function meetingSettings(input: CreateMeetingInput) {
  return {
    host_video: true,
    participant_video: false,
    join_before_host: false,
    waiting_room: true,
    mute_upon_entry: true,
    auto_recording: input.cloudRecording === false ? "none" : "cloud",
    approval_type: 2, // بلا تسجيل مسبق — الوصول عبر الرابط من بوابة الطالب
  };
}

export async function createMeeting(input: CreateMeetingInput): Promise<ZoomMeeting> {
  const host = input.hostEmail ?? "me";
  const data = await zoomFetch<{
    id: number;
    join_url: string;
    start_url: string;
    password?: string;
  }>(`/users/${encodeURIComponent(host)}/meetings`, {
    method: "POST",
    body: JSON.stringify({
      topic: input.topic,
      type: 2, // مجلس مجدوَل بموعد محدَّد
      start_time: input.startsAt.toISOString(),
      duration: input.durationMin ?? 90,
      timezone: process.env.ZOOM_TIMEZONE ?? "Asia/Qatar",
      agenda: input.agenda,
      settings: meetingSettings(input),
    }),
  });

  return {
    meetingId: String(data.id),
    joinUrl: data.join_url,
    startUrl: data.start_url,
    passcode: data.password,
  };
}

export async function updateMeeting(
  meetingId: string,
  input: Partial<CreateMeetingInput>
): Promise<void> {
  const body: Record<string, unknown> = {};
  if (input.topic) body.topic = input.topic;
  if (input.startsAt) body.start_time = input.startsAt.toISOString();
  if (input.durationMin) body.duration = input.durationMin;
  if (input.agenda !== undefined) body.agenda = input.agenda;
  if (input.cloudRecording !== undefined) {
    body.settings = meetingSettings(input as CreateMeetingInput);
  }
  await zoomFetch<void>(`/meetings/${meetingId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteMeeting(meetingId: string): Promise<void> {
  await zoomFetch<void>(`/meetings/${meetingId}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// التسجيلات — تُغني عن الرفع اليدوي الذي كان مطلوبًا مع المزوّد المجّاني
// ---------------------------------------------------------------------------

export interface ZoomRecording {
  playUrl: string;
  downloadUrl: string;
  /** كلمة مرور التسجيل إن وُجدت — تُخزَّن مع الرابط وإلا تعذّرت المشاهدة. */
  passcode?: string;
  durationMin?: number;
}

/** أفضل تسجيل مرئي للمجلس (MP4 للعرض المشترك أو الكاميرا). */
export async function getRecording(meetingId: string): Promise<ZoomRecording | null> {
  try {
    const data = await zoomFetch<{
      duration?: number;
      password?: string;
      recording_files?: { file_type: string; play_url?: string; download_url?: string }[];
    }>(`/meetings/${meetingId}/recordings`);

    const mp4 = data.recording_files?.find((f) => f.file_type === "MP4");
    if (!mp4?.play_url) return null;

    return {
      playUrl: mp4.play_url,
      downloadUrl: mp4.download_url ?? mp4.play_url,
      passcode: data.password,
      durationMin: data.duration,
    };
  } catch (e) {
    // 404 = لا تسجيل لهذا المجلس (لم يُسجَّل أو لم يُعالَج بعد)
    if (String(e).includes("404")) return null;
    throw e;
  }
}

// ---------------------------------------------------------------------------
// الحضور — تقرير المشاركين (باقة مدفوعة فقط)
// ---------------------------------------------------------------------------

export interface ZoomParticipant {
  email?: string;
  name: string;
  joinedAt: string;
  leftAt?: string;
  /** مدّة الحضور بالدقائق */
  minutes: number;
}

/**
 * مشاركو مجلس منتهٍ. تُطابَق النتائج ببريد الطالب لملء جدول Attendance.
 * ترجع مصفوفة فارغة على الباقة المجّانية (تقارير Zoom غير متاحة فيها).
 */
export async function getParticipants(meetingId: string): Promise<ZoomParticipant[]> {
  const out: ZoomParticipant[] = [];
  let token = "";
  try {
    do {
      const page = await zoomFetch<{
        next_page_token?: string;
        participants?: {
          user_email?: string;
          name: string;
          join_time: string;
          leave_time?: string;
          duration?: number;
        }[];
      }>(
        `/report/meetings/${meetingId}/participants?page_size=300` +
          (token ? `&next_page_token=${token}` : "")
      );

      for (const p of page.participants ?? []) {
        out.push({
          email: p.user_email || undefined,
          name: p.name,
          joinedAt: p.join_time,
          leftAt: p.leave_time,
          minutes: Math.round((p.duration ?? 0) / 60),
        });
      }
      token = page.next_page_token ?? "";
    } while (token);
  } catch (e) {
    // 400/404 على الباقة المجّانية — لا نُسقط العمليّة لأجل الحضور
    if (String(e).includes("400") || String(e).includes("404")) return [];
    throw e;
  }
  return out;
}

// ---------------------------------------------------------------------------
// الويب هوك — التحقّق من التوقيع
// ---------------------------------------------------------------------------

/**
 * يتحقّق أنّ الطلب صادر من Zoom فعلًا.
 * Zoom يوقّع `v0:{timestamp}:{rawBody}` بـHMAC-SHA256 بالـSecret Token،
 * ويرسل الترويستين `x-zm-signature` و`x-zm-request-timestamp`.
 * **يجب تمرير الجسم الخام** (قبل JSON.parse) وإلا فشل التطابق.
 */
export async function verifyZoomWebhook(
  rawBody: string,
  signature: string | null,
  timestamp: string | null
): Promise<boolean> {
  const secret = process.env.ZOOM_WEBHOOK_SECRET_TOKEN;
  if (!secret || !signature || !timestamp) return false;

  // رفض الطلبات القديمة (إعادة إرسال)
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) return false;

  const { createHmac, timingSafeEqual } = await import("node:crypto");
  const expected =
    "v0=" + createHmac("sha256", secret).update(`v0:${timestamp}:${rawBody}`).digest("hex");

  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * ردّ تحدّي إثبات ملكيّة الرابط الذي يرسله Zoom عند تفعيل الويب هوك
 * (الحدث `endpoint.url_validation`).
 */
export async function zoomUrlValidation(
  plainToken: string
): Promise<{ plainToken: string; encryptedToken: string }> {
  const { createHmac } = await import("node:crypto");
  return {
    plainToken,
    encryptedToken: createHmac("sha256", process.env.ZOOM_WEBHOOK_SECRET_TOKEN!)
      .update(plainToken)
      .digest("hex"),
  };
}
