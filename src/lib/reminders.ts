/**
 * تنبيهات مواعيد المجالس — من يستحقّ التذكير الآن، ولمن يُرسَل.
 *
 * تُنادى من مهمّة `/api/cron/lecture-reminders`.
 *
 * ---------------------------------------------------------------------------
 * ⚠️ الجدولة وباقة Vercel — اقرأ هذا قبل تعديل النوافذ
 * ---------------------------------------------------------------------------
 * باقة Vercel المجّانية (Hobby) تسمح بمهمّة cron **يوميّة واحدة** فقط، وأي
 * تعبير أكثر تكرارًا (`0 * * * *` مثلًا) **يُفشل النشر نفسه** لا يُتجاهَل.
 * ودقّة التشغيل عندها ±٥٩ دقيقة. لذلك `vercel.json` مضبوط على `0 3 * * *`
 * (يوميًّا الثالثة فجرًا) — وهو الافتراضي الآمن الذي ينشر على أي باقة.
 *
 * ولهذا **فُتحت نافذة التذكير المتقدّم عمدًا** (كل مجلس يبدأ خلال
 * `REMINDER_LEAD_HOURS` القادمة) بدل نافذة ضيّقة حول ٢٤ ساعة. النافذة الضيّقة
 * تصحّ للتشغيل الساعي وحده، وتفشل فشلًا صامتًا مع الجدولة اليوميّة: تشغيلٌ
 * الثالثة فجرًا ومجلسٌ الثامنة مساءً يكون بعيدًا ٤١ ساعة أمسِ و١٧ ساعة اليوم،
 * فيقع خارج ٢٣–٢٦ في الحالتين ولا يصل تذكير أبدًا.
 * **لا تُضيّق هذه النافذة.** الأمان لا يأتي من ضيقها بل من ختم
 * `reminder24SentAt` بعد الإرسال، فلا يُرسل التذكير مرّتين مهما تكرّر التشغيل.
 *
 * الشرط الحسابي للتغطية مع الجدولة اليوميّة: (المدى الأعلى − المدى الأدنى)
 * يجب أن يبلغ ٢٤ ساعة على الأقلّ، وإلّا سقطت مجالس بين تشغيلين. القيم
 * الافتراضيّة (٣٠ ساعة أعلى، ٩٠ دقيقة أدنى) تعطي ٢٨٫٥ ساعة — هامش مريح.
 *
 * ▸ **إن رُقّي المشروع إلى باقة Pro** (وهي شرط تذكير الساعة، إذ نافذته
 *   ٤٥–٩٠ دقيقة تحتاج تشغيلًا كل ساعة):
 *     1. غيّر الجدولة في `vercel.json` إلى `"schedule": "0 * * * *"`.
 *     2. تأكّد أن `REMINDER_HOURLY_ENABLED` غير مضبوط أو مضبوط `"true"`.
 *     3. اترك `REMINDER_LEAD_HOURS` على افتراضه (٣٠): النافذة المفتوحة
 *        صحيحة مع التشغيل الساعي أيضًا، والختم يمنع التكرار.
 *   وعلى Hobby اضبط `REMINDER_HOURLY_ENABLED="false"` ليُتخطّى تذكير الساعة
 *   بهدوء بدل أن يبقى مرحلةً لا تُصادف شيئًا.
 *
 * ---------------------------------------------------------------------------
 * لغة الرسالة: لا حقل لغة على `User` في المخطّط، فالافتراض **العربيّة** — وهي
 * لغة الكلّية وجمهورها. إن أُضيف حقل لغة لاحقًا فالتغيير في `pickLang` وحدها.
 */
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mailer";
import {
  relativeWhen,
  sessionReminderEmail,
  type MailLang,
  type ReminderKind,
} from "@/lib/email-templates";

/**
 * الحالات التي تُعتبر «طالبًا يدرس فعلًا».
 * معرَّفة محليًّا لا مستوردة من `lms.ts`: هذه الوحدة تعمل في مهمّة خلفيّة
 * مستقلّة عن طبقة بوابة الطالب، ونريد ألّا يغيّر تعديلٌ هناك سلوك البريد هنا.
 */
const ACTIVE_ENROLLMENT: ("ACTIVE" | "COMPLETED")[] = ["ACTIVE", "COMPLETED"];

/** عدد الرسائل المتزامنة — Resend يحدّ المعدّل، والتسلسل المحض بطيء جدًّا. */
const SEND_CONCURRENCY = 3;

/** رابط بوابة الطالب داخل المنصّة — وجهة الإشعار الداخلي. */
const PORTAL_HREF = "/student";

// ---------------------------------------------------------------------------
// حساب النوافذ — دوالّ صافية، لا قاعدة بيانات، قابلة للاختبار وحدها
// ---------------------------------------------------------------------------

/** مدى التذكير المتقدّم بالساعات حين لا يُضبط متغيّر البيئة. */
export const DEFAULT_LEAD_HOURS = 30;

/**
 * الحدّ الأدنى للتذكير المتقدّم = الحدّ الأعلى لنافذة الساعة، فتتلاصق
 * النافذتان بلا فجوة ولا تداخل: ما دون التسعين دقيقة شأن تذكير الساعة.
 */
const LEAD_FLOOR_MIN = 90;
const HOURLY_FROM_MIN = 45;
const HOURLY_TO_MIN = 90;

/** `REMINDER_LEAD_HOURS` إن كان عددًا موجبًا، وإلّا الافتراض. */
export function configuredLeadHours(): number {
  const raw = Number(process.env.REMINDER_LEAD_HOURS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_LEAD_HOURS;
}

/**
 * هل تُشغَّل المهمّة كل ساعة؟ الافتراض نعم.
 * `REMINDER_HOURLY_ENABLED="false"` يُلغي مرحلة تذكير الساعة كليًّا — تُضبط
 * هكذا على الباقة المجّانية حيث الجدولة يوميّة ولا يمكن أن تُصادف نافذتها.
 */
export function isHourlyEnabled(): boolean {
  return process.env.REMINDER_HOURLY_ENABLED !== "false";
}

export interface ReminderWindow {
  kind: ReminderKind;
  /** أبكر بداية مجلس تدخل النافذة (شاملة). */
  from: Date;
  /** أبعد بداية مجلس تدخل النافذة (شاملة). */
  to: Date;
}

export interface WindowOptions {
  leadHours?: number;
  hourly?: boolean;
}

/**
 * حدود النوافذ المستحقّة عند لحظة `now`.
 * منفصلة عن الاستعلام قصدًا: هي المنطق الذي يَصعُب ويَجب اختباره، والاستعلام
 * مجرّد ترجمة لها.
 */
export function reminderWindows(now: Date, opts: WindowOptions = {}): ReminderWindow[] {
  const lead = opts.leadHours ?? configuredLeadHours();
  const hourly = opts.hourly ?? isHourlyEnabled();
  const at = (minutes: number) => new Date(now.getTime() + minutes * 60_000);

  const windows: ReminderWindow[] = [
    // نافذة مفتوحة لا ضيّقة — انظر تعليق رأس الملفّ قبل تعديلها.
    { kind: "24h", from: at(LEAD_FLOOR_MIN), to: at(lead * 60) },
  ];
  if (hourly) {
    windows.push({ kind: "1h", from: at(HOURLY_FROM_MIN), to: at(HOURLY_TO_MIN) });
  }
  return windows;
}

/** هل يقع موعد بداية داخل نافذة؟ (أداة اختبار وقراءة، لا يستعملها الاستعلام) */
export function isInWindow(window: ReminderWindow, startsAt: Date): boolean {
  return startsAt >= window.from && startsAt <= window.to;
}

/** ترجمة النافذة إلى شرط Prisma، مع اشتراط أن الختم لم يوضع بعد. */
function whereFor(window: ReminderWindow): Prisma.LiveSessionWhereInput {
  return {
    visible: true,
    startsAt: { gte: window.from, lte: window.to },
    ...(window.kind === "24h" ? { reminder24SentAt: null } : { reminder1SentAt: null }),
  };
}

// ---------------------------------------------------------------------------
// الاستعلامات
// ---------------------------------------------------------------------------

export interface ReminderSummary {
  /** عدد المجالس التي عولجت في هذا التشغيل. */
  sessions: number;
  /** عدد الرسائل التي نجح إرسالها (أو حوكيت بلا مفتاح). */
  emails: number;
  /** عدد الرسائل التي فشلت. */
  failed: number;
  /** true = تُخطّيت مرحلة تذكير الساعة لأن البيئة لا تشغّل المهمّة كل ساعة. */
  hourlySkipped: boolean;
}

function dueSessions(where: Prisma.LiveSessionWhereInput) {
  return prisma.liveSession.findMany({
    where,
    orderBy: { startsAt: "asc" },
    include: { course: true, instructor: true },
  });
}

type DueSession = Awaited<ReturnType<typeof dueSessions>>[number];

interface Recipient {
  id: string;
  name: string;
  email: string;
}

/**
 * طلاب المجلس: طلاب مقرّره، وطلاب مرحلته، وكلّ الطلاب إن كان عامًّا.
 *
 * الاتّحاد يُبنى في استعلام `OR` واحد على `User` بدل ثلاثة استعلامات ثمّ دمج:
 * فبريد المستخدم فريد في المخطّط، والاستعلام الواحد يُسقط التكرار من أصله
 * (الطالب المسجَّل في المقرّر وفي المرحلة معًا يظهر مرّة واحدة).
 *
 * يُشترط `role = STUDENT` و`status = ACTIVE` في كل الحالات لا في العامّة فقط:
 * حساب معطَّل أو حساب إداريّ مسجَّل للتجربة لا ينبغي أن يصله تذكير.
 */
async function recipientsFor(session: DueSession): Promise<Recipient[]> {
  const scopes: Prisma.UserWhereInput[] = [];

  if (session.courseId) {
    scopes.push({
      enrollments: { some: { courseId: session.courseId, status: { in: ACTIVE_ENROLLMENT } } },
    });
  }
  if (session.stageId) {
    scopes.push({
      stageEnrollments: { some: { stageId: session.stageId, status: { in: ACTIVE_ENROLLMENT } } },
    });
  }
  // شرط فارغ = بلا تقييد إضافي، أي كلّ طالب نشِط.
  if (session.isPublic) scopes.push({});

  // مجلس بلا مقرّر ولا مرحلة وليس عامًّا: لا جمهور له — لا نُرسل شيئًا.
  if (!scopes.length) return [];

  const users = await prisma.user.findMany({
    where: { role: "STUDENT", status: "ACTIVE", OR: scopes },
    select: { id: true, name: true, email: true },
  });

  // حارس إضافي على مستوى البريد: المخطّط يضمن تفرّده، لكنّ ضمان «لا بريدين
  // لطالب واحد» مطلبٌ صريح لا نتركه رهنَ قيدٍ في مكان آخر.
  const seen = new Set<string>();
  return users.filter((u) => {
    const key = u.email.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ---------------------------------------------------------------------------
// الإرسال
// ---------------------------------------------------------------------------

/**
 * لغة رسالة الطالب. لا حقل لغة على `User` في المخطّط، فالعربيّة هي الافتراض
 * الوحيد اليوم؛ وُضعت في دالّة لأن إضافة الحقل لاحقًا تغيّر هذا الموضع وحده.
 */
function pickLang(user: Recipient): MailLang {
  void user;
  return "ar";
}

/**
 * نصّ الإشعار داخل المنصّة. يشتقّ ظرفه من الوقت المتبقّي كالبريد تمامًا،
 * لا من مرحلة التذكير — وإلّا قرأ الطالب «غدًا» عن مجلسٍ بعد ثلاث ساعات.
 */
function sessionTitles(session: DueSession, now: Date) {
  const ar = relativeWhen(session.startsAt, now, "ar");
  const en = relativeWhen(session.startsAt, now, "en");
  return {
    titleAr: `تذكير بمجلس ${ar.phrase}`,
    titleEn: `Session reminder — ${en.phrase}`,
    bodyAr: `«${session.titleAr}» ${ar.phrase} بإذن الله.`,
    bodyEn: `"${session.titleEn}" — ${en.phrase}.`,
  };
}

/** يرسل رسائل مجلس واحد، ويُنشئ إشعارًا داخل المنصّة لكل طالب. */
async function remindSession(
  session: DueSession,
  now: Date
): Promise<{ emails: number; failed: number }> {
  const recipients = await recipientsFor(session);
  if (!recipients.length) return { emails: 0, failed: 0 };

  // الإشعار داخل المنصّة أوّلًا: كتابة واحدة رخيصة، وتضمن أن يرى الطالب
  // التنبيه في بوابته حتى لو تعثّر البريد كلّه.
  const n = sessionTitles(session, now);
  await prisma.notification.createMany({
    data: recipients.map((u) => ({
      userId: u.id,
      kind: "session",
      titleAr: n.titleAr,
      titleEn: n.titleEn,
      bodyAr: n.bodyAr,
      bodyEn: n.bodyEn,
      href: PORTAL_HREF,
    })),
  });

  let emails = 0;
  let failed = 0;

  for (let i = 0; i < recipients.length; i += SEND_CONCURRENCY) {
    const batch = recipients.slice(i, i + SEND_CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (user) => {
        const lang = pickLang(user);
        const { subject, html } = sessionReminderEmail({
          lang,
          now,
          studentName: user.name,
          sessionTitle: lang === "en" ? session.titleEn || session.titleAr : session.titleAr,
          courseTitle: session.course
            ? lang === "en"
              ? session.course.titleEn || session.course.titleAr
              : session.course.titleAr
            : null,
          instructorName: session.instructor
            ? lang === "en"
              ? session.instructor.nameEn || session.instructor.nameAr
              : session.instructor.nameAr
            : null,
          startsAt: session.startsAt,
          durationMin: session.durationMin,
          joinUrl: session.joinUrl,
        });
        return { user, res: await sendMail({ to: user.email, subject, html }) };
      })
    );

    for (const { user, res } of results) {
      if (res.ok) {
        emails++;
      } else {
        failed++;
        console.error(`[reminders] فشل بريد ${user.email} للمجلس ${session.id}: ${res.error}`);
      }
    }
  }

  return { emails, failed };
}

// ---------------------------------------------------------------------------
// نقطة الدخول
// ---------------------------------------------------------------------------

/**
 * يعالج كل المجالس المستحقّة للتذكير الآن.
 * `now` و`opts` معلَمتان لا قيمًا مقروءة من البيئة مباشرةً، ليمكن اختبار
 * النوافذ بلا انتظار الزمن ولا ضبط متغيّرات.
 */
export async function sendDueReminders(
  now: Date = new Date(),
  opts: WindowOptions = {}
): Promise<ReminderSummary> {
  const windows = reminderWindows(now, opts);
  const hourlySkipped = !windows.some((w) => w.kind === "1h");

  const summary: ReminderSummary = { sessions: 0, emails: 0, failed: 0, hourlySkipped };

  if (hourlySkipped) {
    console.info(
      "[reminders] تذكير الساعة مُعطَّل (REMINDER_HOURLY_ENABLED=false) — التذكير المتقدّم وحده يعمل."
    );
  }

  for (const window of windows) {
    const sessions = await dueSessions(whereFor(window));

    for (const session of sessions) {
      summary.sessions++;
      try {
        const { emails, failed } = await remindSession(session, now);
        summary.emails += emails;
        summary.failed += failed;
      } catch (e) {
        // خلل غير متوقّع في مجلس واحد لا يُسقط بقيّة المجالس.
        console.error(`[reminders] تعذّرت معالجة المجلس ${session.id}:`, e);
      }

      // الختم **بعد** المحاولة ولو فشل بعض البريد: تركه فارغًا يعني إعادة
      // الإرسال في كل تشغيل تالٍ داخل النافذة، فيغرق الناجحون بالتكرار
      // لأجل الفاشلين. الفشل يُسجَّل في الطرفيّة ويُعالَج يدويًّا.
      await prisma.liveSession.update({
        where: { id: session.id },
        data:
          window.kind === "24h"
            ? { reminder24SentAt: new Date() }
            : { reminder1SentAt: new Date() },
      });
    }
  }

  return summary;
}
