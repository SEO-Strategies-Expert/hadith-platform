/**
 * عناصر مشتركة بين صفحات بوابة الطالب (اللوحة، المقرّر، الدرس).
 *
 * وُضعت هنا لئلّا تتكرّر في ثلاث صفحات، ولأنّ التصميم يمنع إضافة ملفّ CSS
 * جديد — فأي تنسيق لا يوجد له صنف جاهز يُكتب `style` مضمَّنًا في مكوّنٍ واحد
 * يُستدعى من الجميع.
 */
import type { Lang } from "@/lib/site-data";
import { toArDigits } from "@/lib/site-format";

// ألوان الهويّة — مكرّرة هنا لأنّ التنسيق المضمَّن لا يقرأ متغيّرات CSS بأمان.
export const NAVY = "#123159";
export const GOLD = "#D8AB4A";

/** رابط داخل بوابة الطالب. مسارات البوابة ليست `.html` فلا تمرّ بـ`siteHref`. */
export function studentHref(lang: Lang, sub = ""): string {
  const base = lang === "en" ? "/en/student" : "/student";
  return sub ? `${base}${sub}` : base;
}

/** رقم بالأرقام العربيّة في الواجهة العربيّة فقط. */
export function num(n: number | string, lang: Lang): string {
  return lang === "ar" ? toArDigits(n) : String(n);
}

/** نسبة مئويّة منسَّقة حسب اللغة. */
export function pctLabel(pct: number, lang: Lang): string {
  const v = clampPct(pct);
  return lang === "ar" ? `${toArDigits(v)}٪` : `${v}%`;
}

export function clampPct(pct: number): number {
  if (!Number.isFinite(pct)) return 0;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

/** شريط تقدّم — لا صنف CSS له في الموقع، فيُبنى بتنسيق مضمَّن. */
export function ProgressBar({
  pct,
  lang,
  label,
}: {
  pct: number;
  lang: Lang;
  label?: string;
}) {
  const v = clampPct(pct);
  return (
    <div style={{ marginTop: 14 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 10,
          fontSize: 13,
          fontWeight: 800,
          color: NAVY,
          marginBottom: 6,
        }}
      >
        <span>{label ?? ""}</span>
        <span style={{ color: "#8a6a1c" }}>{pctLabel(v, lang)}</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={v}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? (lang === "ar" ? "نسبة الإنجاز" : "Completion")}
        style={{
          height: 10,
          borderRadius: 999,
          background: "rgba(18,49,89,.12)",
          border: "1px solid rgba(18,49,89,.10)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${v}%`,
            height: "100%",
            borderRadius: 999,
            background: `linear-gradient(90deg, ${GOLD}, #b9862a)`,
          }}
        />
      </div>
    </div>
  );
}

/** شارة صغيرة (حالة المجلس، نوع الدرس…) بتنسيق مضمَّن على طراز الهويّة. */
export function Pill({
  children,
  tone = "gold",
}: {
  children: React.ReactNode;
  tone?: "gold" | "navy" | "muted";
}) {
  const tones = {
    gold: { bg: "rgba(217,174,75,.18)", bd: "rgba(217,174,75,.5)", fg: "#8a6a1c" },
    navy: { bg: "rgba(18,49,89,.10)", bd: "rgba(18,49,89,.25)", fg: NAVY },
    muted: { bg: "rgba(18,49,89,.05)", bd: "rgba(18,49,89,.14)", fg: "#5c6b80" },
  }[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 12px",
        borderRadius: 999,
        fontSize: 12.5,
        fontWeight: 800,
        background: tones.bg,
        border: `1px solid ${tones.bd}`,
        color: tones.fg,
      }}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// تحليل روابط الفيديو
// ---------------------------------------------------------------------------

export type VideoSource =
  | { mode: "iframe"; src: string }
  | { mode: "file"; src: string }
  | { mode: "link"; src: string };

const FILE_EXT = /\.(mp4|webm|ogv|ogg|m4v|mov)(?:[?#]|$)/i;
const YT_ID = /^[A-Za-z0-9_-]{6,}$/;

/**
 * يحوّل رابط الدرس إلى أفضل صيغة عرض ممكنة.
 *
 * القاعدة الحاكمة: **لا نكسر الصفحة برابط لا نعرفه** — كل ما لم نتعرّف عليه
 * يسقط إلى زرّ يفتحه في تبويب جديد بدل مشغّلٍ فارغ.
 */
export function resolveVideo(raw: string | null | undefined): VideoSource | null {
  const url = (raw ?? "").trim();
  if (!url) return null;

  // روابط نسبيّة أو مسارات مرفوعة: نحكم عليها بالامتداد وحده.
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(url)) {
    return FILE_EXT.test(url) ? { mode: "file", src: url } : { mode: "link", src: url };
  }

  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return { mode: "link", src: url };
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return { mode: "link", src: url };

  const host = u.hostname.replace(/^www\./i, "").toLowerCase();
  const seg = u.pathname.split("/").filter(Boolean);

  // يوتيوب بكل صوره: watch / youtu.be / embed / shorts / live / v
  if (host === "youtu.be") {
    const id = seg[0];
    if (id && YT_ID.test(id)) return { mode: "iframe", src: ytEmbed(id, u) };
  }
  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    const v = u.searchParams.get("v");
    if (v && YT_ID.test(v)) return { mode: "iframe", src: ytEmbed(v, u) };
    if (seg.length >= 2 && ["embed", "shorts", "live", "v"].includes(seg[0]) && YT_ID.test(seg[1])) {
      return { mode: "iframe", src: ytEmbed(seg[1], u) };
    }
  }

  // فيميو: رقم المقطع في أوّل جزء من المسار.
  if (host === "vimeo.com" && seg[0] && /^\d+$/.test(seg[0])) {
    return { mode: "iframe", src: `https://player.vimeo.com/video/${seg[0]}` };
  }
  if (host === "player.vimeo.com") return { mode: "iframe", src: u.toString() };

  if (FILE_EXT.test(u.pathname)) return { mode: "file", src: u.toString() };

  return { mode: "link", src: u.toString() };
}

/** يحافظ على لحظة البدء `t/start` إن وُجدت في الرابط الأصلي. */
function ytEmbed(id: string, from: URL): string {
  const t = from.searchParams.get("start") ?? from.searchParams.get("t");
  const secs = t ? parseYtTime(t) : 0;
  return `https://www.youtube-nocookie.com/embed/${id}${secs ? `?start=${secs}` : ""}`;
}

function parseYtTime(t: string): number {
  if (/^\d+$/.test(t)) return Number(t);
  const m = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/i.exec(t.trim());
  if (!m) return 0;
  return Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
}
