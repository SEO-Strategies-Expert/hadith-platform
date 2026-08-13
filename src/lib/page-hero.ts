import type { Page } from "@prisma/client";
import type { Lang } from "@/lib/site-data";

function esc(s: string): string {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));
}

function replaceInner(html: string, re: RegExp, text: string | null): string {
  if (!text) return html;
  return html.replace(re, (_m, open: string, _inner: string, close: string) => `${open}${esc(text)}${close}`);
}

const KICKER_RE = /(<p class="page-kicker">)([\s\S]*?)(<\/p>)/;
const TITLE_RE = /(<h1 class="page-title[^"]*">)([\s\S]*?)(<\/h1>)/;
const INTRO_RE = /(<p class="page-intro">)([\s\S]*?)(<\/p>)/;
const IMG_RE = /(<img class="hero-bg"[^>]*\ssrc=")([^"]*)(")/;

// يطبّق حقول الهيرو المخصَّصة من لوحة التحكم (Page.heroTitleAr/En…) على قالب
// page-hero المخزَّن، بدل الاكتفاء بالنص الأصلي المُرحَّل وقت الاستيراد.
export function applyHeroOverrides(html: string, page: Page, lang: Lang): string {
  const kicker = lang === "ar" ? page.heroKickerAr : page.heroKickerEn;
  const title = lang === "ar" ? page.heroTitleAr : page.heroTitleEn;
  const intro = lang === "ar" ? page.heroIntroAr : page.heroIntroEn;

  let out = html;
  out = replaceInner(out, KICKER_RE, kicker);
  out = replaceInner(out, TITLE_RE, title);
  out = replaceInner(out, INTRO_RE, intro);
  if (page.heroImage) {
    out = out.replace(IMG_RE, (_m, open: string, _src: string, close: string) => `${open}${page.heroImage}${close}`);
  }
  return out;
}
