import type { DiwanRow, Lang } from "@/lib/site-data";

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
function toArDigits(n: number): string {
  return String(n).replace(/[0-9]/g, (d) => AR_DIGITS[+d]);
}

function esc(s: string | null | undefined): string {
  if (!s) return "";
  return s.replace(/[&<>'"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c] as string)
  );
}

function initial(name: string, lang: Lang): string {
  const clean = name.replace(/^(أ\.د\.|د\.|أ\.|Prof\. Dr\.|Prof\.|Dr\.)\s*/, "").trim();
  return clean.charAt(0) || (lang === "en" ? "?" : "؟");
}

// يبني نفس ترميز <li class="thread"> الذي تولّده diwan() في main.js — يُستخدم للتصيير الأوّلي من الخادم.
export function renderThreadsHtml(rows: DiwanRow[], lang: Lang): string {
  if (rows.length === 0) {
    const empty =
      lang === "ar"
        ? "لا توجد مجالس بعد."
        : "No councils yet.";
    return `<li class="thread"><div class="thread-body"><p class="thread-title">${empty}</p></div></li>`;
  }

  return rows
    .map((x, i) => {
      const num = lang === "ar" ? toArDigits(x.n) : String(x.n);
      const pinLabel = lang === "ar" ? "مثبَّت" : "Pinned";
      const postsLabel = lang === "ar" ? "مشاركة" : "posts";
      const pinBadge = x.pin ? `<span class="thread-pin">${pinLabel}</span> ` : "";
      return (
        `<li class="thread" style="animation-delay:${Math.min(i * 40, 320)}ms">` +
        `<span class="avatar" aria-hidden="true">${esc(initial(x.a, lang))}</span>` +
        `<div class="thread-body">` +
        `<p class="thread-title">${pinBadge}${esc(x.t)}</p>` +
        `<div class="thread-meta">` +
        `<span>${esc(x.a)}</span>` +
        `<span class="rank">${esc(x.r)}</span>` +
        `<span class="tag">${esc(x.tag)}</span>` +
        `<span>${esc(x.d)}</span>` +
        `</div></div>` +
        `<div class="thread-stats"><b>${num}</b><span>${postsLabel}</span></div>` +
        `</li>`
      );
    })
    .join("");
}

// يستبدل حاوية <ul id="threads" ...></ul> الفارغة في محتوى الصفحة المخزَّن بقائمة مُصيَّرة من قاعدة البيانات.
export function injectDiwanThreads(html: string, rows: DiwanRow[], lang: Lang): string {
  const marker = /(<ul class="threads[^"]*" id="threads"[^>]*>)(\s*)(<\/ul>)/;
  if (!marker.test(html)) return html;
  const listHtml = renderThreadsHtml(rows, lang);
  return html.replace(marker, `$1${listHtml}$3`);
}
