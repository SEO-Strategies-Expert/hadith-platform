/**
 * قوالب البريد — HTML جاهز للإرسال، عربيّ RTL وإنجليزيّ LTR.
 *
 * ثلاثة قيود يفرضها البريد ولا يفرضها المتصفّح، وهي سبب شكل الكود هنا:
 *   1. عملاء البريد (Outlook خاصّة) لا يعوّلون على flex/grid → التخطيط بجداول.
 *   2. لا ملفّات CSS خارجيّة ولا خطوط ويب → أنماط سطريّة وخطوط نظام آمنة.
 *   3. `dir` و`lang` يجب أن يكونا على `<html>` نفسه، وإلّا انقلبت الفقرات
 *      العربيّة في بعض العملاء رغم صحّة المحتوى.
 *
 * الهروب من HTML: `esc` **محليّة** هنا ولا تُستورد من `site-format` — القالب
 * يجب أن يبقى مستقلًّا عن طبقة عرض الموقع، وكل قيمة تأتي من قاعدة البيانات
 * (عنوان مجلس، اسم طالب، اسم محاضر) تمرّ عليها بلا استثناء.
 */

export type MailLang = "ar" | "en";

/** توقيت العرض — نفس متغيّر Zoom لئلّا يختلف وقت البريد عن وقت المجلس. */
const TZ = process.env.ZOOM_TIMEZONE ?? "Asia/Qatar";

// ألوان هويّة الكلّية
const NAVY = "#123159";
const GOLD = "#D8AB4A";
const CREAM = "#F7F3EA";
const PAPER = "#FFFFFF";
const INK = "#22303F";
const MUTED = "#68727F";

const FONT_AR = "'Segoe UI', Tahoma, Arial, 'Traditional Arabic', sans-serif";
const FONT_EN = "'Segoe UI', Helvetica, Arial, sans-serif";

// ---------------------------------------------------------------------------
// أدوات الهروب والتنسيق
// ---------------------------------------------------------------------------

/** هروب HTML لكل نصّ قادم من قاعدة البيانات. لا تتجاوزها ولو بدا النصّ آمنًا. */
export function esc(s: string | null | undefined): string {
  if (!s) return "";
  return s.replace(
    /[&<>'"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[c] as string
  );
}

/**
 * رابط آمن للاستعمال في `href`.
 * `joinUrl` يُلصق يدويًّا في اللوحة، فقد يصل نصًّا غير رابط — ونمنع `javascript:`
 * وغيرها من المخطّطات القابلة للتنفيذ. ما لم يكن http(s) يُعامَل كأنّه غير موجود.
 */
function safeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url.trim());
    return u.protocol === "http:" || u.protocol === "https:" ? esc(u.toString()) : null;
  } catch {
    return null;
  }
}

function locale(lang: MailLang): string {
  return lang === "en" ? "en-GB" : "ar-QA";
}

/** التاريخ كاملًا بتوقيت الكلّية (اليوم والشهر والسنة). */
export function dateLabel(d: Date, lang: MailLang): string {
  return new Intl.DateTimeFormat(locale(lang), {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TZ,
  }).format(d);
}

/** الساعة والدقيقة بتوقيت الكلّية. */
export function timeLabel(d: Date, lang: MailLang): string {
  return new Intl.DateTimeFormat(locale(lang), {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  }).format(d);
}

// ---------------------------------------------------------------------------
// القالب الموحَّد
// ---------------------------------------------------------------------------

export interface LayoutInput {
  lang: MailLang;
  /** عنوان الصفحة وشريط الترويسة — يُهرَب هنا، فمرّره نصًّا خامًّا. */
  heading: string;
  /** السطر الذي يعرضه صندوق الوارد قبل الفتح. */
  preheader?: string;
  /** جسم الرسالة — HTML **مبنيّ داخل هذا الملفّ** وقيمه مهروبة سلفًا. */
  bodyHtml: string;
}

/**
 * يغلّف المحتوى بترويسة الكلّية وتذييلها.
 * عرض ثابت 600px: العرض المتّفق عليه بين عملاء البريد، وما زاد يُقصّ في Outlook.
 */
export function emailLayout({ lang, heading, preheader, bodyHtml }: LayoutInput): string {
  const rtl = lang !== "en";
  const dir = rtl ? "rtl" : "ltr";
  const font = rtl ? FONT_AR : FONT_EN;
  const align = rtl ? "right" : "left";
  const brand = rtl ? "الكلّية العليا للحديث النبوي" : "Higher Faculty of Prophetic Hadith";
  const footer = rtl
    ? "رسالة آليّة من منصّة الكلّية — لا حاجة للردّ عليها."
    : "Automated message from the Faculty platform — no reply needed.";

  return `<!doctype html>
<html dir="${dir}" lang="${rtl ? "ar" : "en"}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(heading)}</title>
</head>
<body style="margin:0;padding:0;background:${CREAM};font-family:${font};color:${INK};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader ?? heading)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${CREAM};padding:24px 12px;">
<tr><td align="center">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;background:${PAPER};border:1px solid #E4DCCB;border-radius:10px;overflow:hidden;">
    <tr>
      <td align="center" style="background:${NAVY};padding:22px 20px;">
        <div style="color:${GOLD};font-family:${font};font-size:18px;font-weight:bold;letter-spacing:.3px;">${esc(brand)}</div>
      </td>
    </tr>
    <tr>
      <td align="${align}" dir="${dir}" style="padding:26px 26px 8px 26px;font-family:${font};">
        <h1 style="margin:0;font-size:20px;line-height:1.5;color:${NAVY};font-weight:bold;">${esc(heading)}</h1>
      </td>
    </tr>
    <tr>
      <td align="${align}" dir="${dir}" style="padding:4px 26px 26px 26px;font-family:${font};font-size:15px;line-height:1.85;color:${INK};">
${bodyHtml}
      </td>
    </tr>
    <tr>
      <td align="center" style="background:${CREAM};border-top:1px solid #E4DCCB;padding:16px 20px;font-family:${font};font-size:12px;line-height:1.7;color:${MUTED};">
        ${esc(footer)}
      </td>
    </tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// تذكير بمجلس مباشر
// ---------------------------------------------------------------------------

/**
 * مرحلة التذكير: المتقدّم أم القريب.
 * ⚠️ هذه **مرحلة تشغيليّة لا صياغة**: لا تشتقّ منها نصّ «غدًا/اليوم». نافذة
 * التذكير المتقدّم مفتوحة (انظر `reminders.ts`)، فقد يقع فيها مجلس بعد ثلاث
 * ساعات كما يقع مجلس بعد ثلاثين. الصياغة تُشتقّ من `relativeWhen` وحدها.
 */
export type ReminderKind = "24h" | "1h";

// ---------------------------------------------------------------------------
// الظرف الزمنيّ — «غدًا» انقلابُ تاريخٍ لا فارقُ ساعات
// ---------------------------------------------------------------------------

/**
 * ترتيب اليوم التقويميّ **بتوقيت الكلّية** كعدد صحيح.
 * المقارنة بفارق الساعات المجرَّد تُخطئ: أربع عشرة ساعة قد تكون «اليوم» (من
 * الثامنة صباحًا إلى العاشرة مساءً) وقد تكون «غدًا» (من الثامنة مساءً إلى
 * العاشرة صباحًا). وحتى المقارنة بتاريخ UTC تُخطئ، لأن الدوحة تسبقه بثلاث
 * ساعات فينقلب يومها قبل انقلابه. لذا نستخرج (سنة/شهر/يوم) في المنطقة نفسها
 * ثمّ نحوّلها إلى رقم يوم قابل للطرح.
 */
function zonedDayNumber(d: Date): number {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const at = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return Math.floor(Date.UTC(at("year"), at("month") - 1, at("day")) / 86_400_000);
}

/** مفتاح مجرّد للظرف — يُختبر ويُفرَّع عليه بلا تعلّق بنصّ لغة بعينها. */
export type WhenKey = "soon" | "within-hour" | "today" | "tomorrow" | "day-after" | "days";

export interface RelativeWhen {
  key: WhenKey;
  /** فارق الأيّام التقويميّة بتوقيت الكلّية: ٠ = اليوم، ١ = غدًا… */
  dayDelta: number;
  minutesAway: number;
  /** الظرف كما يُقرأ في الجملة: «غدًا»، «اليوم»، «خلال ساعة»… */
  phrase: string;
}

function arabicNumber(n: number): string {
  return new Intl.NumberFormat("ar-QA").format(n);
}

/**
 * الظرف الزمنيّ للمجلس نسبةً إلى اللحظة الحاضرة.
 * القُرب يغلب انقلاب التاريخ: مجلس بعد أربعين دقيقة عبر منتصف الليل هو
 * «خلال ساعة» لا «غدًا» — فالطالب يريد أن يعرف أنه على الأبواب.
 */
export function relativeWhen(startsAt: Date, now: Date, lang: MailLang): RelativeWhen {
  const minutesAway = Math.round((startsAt.getTime() - now.getTime()) / 60_000);
  const dayDelta = zonedDayNumber(startsAt) - zonedDayNumber(now);
  const ar = lang !== "en";

  const make = (key: WhenKey, phrase: string): RelativeWhen => ({
    key,
    dayDelta,
    minutesAway,
    phrase,
  });

  if (minutesAway < 15) return make("soon", ar ? "بعد قليل" : "starting shortly");
  if (minutesAway < 90) return make("within-hour", ar ? "خلال ساعة" : "starting within the hour");
  if (dayDelta <= 0) return make("today", ar ? "اليوم" : "later today");
  if (dayDelta === 1) return make("tomorrow", ar ? "غدًا" : "tomorrow");
  if (dayDelta === 2) return make("day-after", ar ? "بعد غدٍ" : "the day after tomorrow");

  // العربيّة تميّز جمع القلّة: ٣–١٠ «أيّام»، وما فوقها تمييزٌ مفرد منصوب.
  const arDays = dayDelta <= 10 ? `${arabicNumber(dayDelta)} أيّام` : `${arabicNumber(dayDelta)} يومًا`;
  return make("days", ar ? `بعد ${arDays}` : `in ${dayDelta} days`);
}

export interface SessionReminderInput {
  lang: MailLang;
  studentName: string;
  sessionTitle: string;
  courseTitle?: string | null;
  instructorName?: string | null;
  startsAt: Date;
  durationMin?: number | null;
  /** رابط الانضمام — قد يكون فارغًا في الوضع اليدوي قبل إنشاء المجلس. */
  joinUrl?: string | null;
  /**
   * اللحظة التي تُحسب منها الصياغة. تُمرَّر من المهمّة لتكون كل رسائل التشغيل
   * الواحد متّسقة، ولتُختبر الصياغة بلا تعلّق بالزمن الحقيقيّ.
   */
  now?: Date;
}

/** صفّ «تسمية: قيمة» داخل بطاقة التفاصيل. */
function detailRow(label: string, value: string, rtl: boolean): string {
  const pad = rtl ? "padding:4px 0 4px 10px" : "padding:4px 10px 4px 0";
  return `<tr>
        <td style="${pad};font-size:13px;color:${MUTED};white-space:nowrap;vertical-align:top;">${esc(label)}</td>
        <td style="padding:4px 0;font-size:14px;color:${INK};font-weight:600;">${esc(value)}</td>
      </tr>`;
}

/**
 * رسالة التذكير بموعد المجلس.
 * ترجع الموضوع والجسم معًا لأن نصّ الموضوع يتبع اللغة والظرف الزمنيّ نفسيهما.
 */
export function sessionReminderEmail(input: SessionReminderInput): {
  subject: string;
  html: string;
} {
  const rtl = input.lang !== "en";
  const font = rtl ? FONT_AR : FONT_EN;
  const link = safeUrl(input.joinUrl);

  const when = `${dateLabel(input.startsAt, input.lang)} — ${timeLabel(input.startsAt, input.lang)}`;

  // الصياغة من الوقت المتبقّي فعلًا لا من مرحلة التذكير: النافذة المتقدّمة
  // مفتوحة، فمجلسٌ بعد ثلاث ساعات يقع فيها كما يقع مجلسٌ بعد ثلاثين.
  const rel = relativeWhen(input.startsAt, input.now ?? new Date(), input.lang);
  const imminent = rel.key === "soon" || rel.key === "within-hour";

  const t = rtl
    ? {
        subject: imminent
          ? `تنبيه: مجلس «${input.sessionTitle}» ${rel.phrase}`
          : `تذكير: مجلس «${input.sessionTitle}» ${rel.phrase}`,
        heading: imminent ? `مجلسك يبدأ ${rel.phrase}` : `تذكير بموعد مجلسك ${rel.phrase}`,
        greeting: (n: string) => `السّلام عليكم ورحمة الله، ${n}`,
        lead: imminent
          ? `يبدأ مجلسك المباشر ${rel.phrase} بإذن الله:`
          : `نُذكّرك بموعد مجلسك المباشر ${rel.phrase} بإذن الله:`,
        session: "المجلس",
        course: "المقرّر",
        instructor: "المحاضر",
        when: "الموعد",
        duration: "المدّة",
        minutes: (n: number) => `${n} دقيقة`,
        tz: "التوقيت المعروض بتوقيت الدوحة (Asia/Qatar).",
        cta: "انضمّ إلى المجلس",
        noLink:
          "رابط الانضمام لم يُنشَر بعد؛ سيصلك قبل الموعد، وتجده كذلك في بوابة الطالب.",
        outro: "نسأل الله لك التوفيق والسّداد.",
      }
    : {
        subject: imminent
          ? `Starting soon: "${input.sessionTitle}" — ${rel.phrase}`
          : `Reminder: "${input.sessionTitle}" — ${rel.phrase}`,
        heading: `Your session is ${rel.phrase}`,
        greeting: (n: string) => `Dear ${n},`,
        lead: imminent
          ? `Your live session is ${rel.phrase}:`
          : `This is a reminder of your live session ${rel.phrase}:`,
        session: "Session",
        course: "Course",
        instructor: "Instructor",
        when: "Date & time",
        duration: "Duration",
        minutes: (n: number) => `${n} minutes`,
        tz: "Times are shown in Doha time (Asia/Qatar).",
        cta: "Join the session",
        noLink:
          "The join link has not been published yet; it will reach you before the session and is also available in the student portal.",
        outro: "We wish you a fruitful session.",
      };

  const rows = [
    detailRow(t.session, input.sessionTitle, rtl),
    input.courseTitle ? detailRow(t.course, input.courseTitle, rtl) : "",
    input.instructorName ? detailRow(t.instructor, input.instructorName, rtl) : "",
    detailRow(t.when, when, rtl),
    input.durationMin ? detailRow(t.duration, t.minutes(input.durationMin), rtl) : "",
  ]
    .filter(Boolean)
    .join("\n");

  // زرّ الانضمام أو بديله النصّي — لا نعرض زرًّا مكسورًا بلا رابط.
  const action = link
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 6px 0;">
        <tr><td align="center" bgcolor="${NAVY}" style="border-radius:8px;">
          <a href="${link}" style="display:inline-block;padding:12px 30px;font-family:${font};font-size:15px;font-weight:bold;color:${GOLD};text-decoration:none;border-radius:8px;">${esc(t.cta)}</a>
        </td></tr>
      </table>`
    : `<p style="margin:20px 0 6px 0;padding:12px 14px;background:${CREAM};border-${rtl ? "right" : "left"}:3px solid ${GOLD};font-size:14px;color:${INK};">${esc(t.noLink)}</p>`;

  const bodyHtml = `<p style="margin:0 0 12px 0;">${esc(t.greeting(input.studentName))}</p>
<p style="margin:0 0 16px 0;">${esc(t.lead)}</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${CREAM};border:1px solid #E7DFCE;border-radius:8px;padding:14px 16px;">
${rows}
</table>
${action}
<p style="margin:14px 0 0 0;font-size:12px;color:${MUTED};">${esc(t.tz)}</p>
<p style="margin:16px 0 0 0;">${esc(t.outro)}</p>`;

  return {
    subject: t.subject,
    html: emailLayout({
      lang: input.lang,
      heading: t.heading,
      preheader: `${input.sessionTitle} — ${when}`,
      bodyHtml,
    }),
  };
}
