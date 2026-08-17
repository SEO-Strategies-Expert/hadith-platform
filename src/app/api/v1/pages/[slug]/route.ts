/**
 * محتوى صفحة من صفحات الموقع، **مفكَّكًا إلى كتل** ليرسمها التطبيق أصليًّا.
 *
 * لماذا لا نُرجع HTML ليعرضه إطارُ ويب؟ لأنّ الإطار يُظهر الصفحة بإطار الموقع
 * كاملًا (هيدر وفوتر) داخل تطبيقٍ له هيدره، ولأنّ نسخة الويب من الإطار تعرض
 * رسالة «افتحها من الموقع» — وكلاهما مرفوض: كل شيء يكون داخل التطبيق.
 *
 * فنحلّل المتن هنا على الخادم إلى كتلٍ بسيطة (عنوان/فقرة/صورة/قائمة/اقتباس)
 * يرسمها التطبيق بمكوّناته وخطوطه وألوانه. والمحتوى يبقى مصدره قاعدة البيانات
 * نفسها، فأي تعديل من اللوحة يظهر في الموقع والتطبيق معًا.
 */
import * as cheerio from "cheerio";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "../../_lib";
import { cors, preflight } from "../../_http";
import { ApiError } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Block =
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "image"; url: string; alt?: string }
  | { type: "quote"; text: string };

/** نصٌّ نظيف: يُزال التكرار في المسافات ويُحذف الفارغ. */
const clean = (s: string) => s.replace(/\s+/g, " ").trim();

function extract(html: string, siteOrigin: string): Block[] {
  const $ = cheerio.load(html);
  // عناصر لا معنى لها خارج المتصفّح: السكربتات والأنماط وأيقونات SVG.
  $("script, style, svg, noscript, .breadcrumbs, .to-top").remove();

  const blocks: Block[] = [];
  const seen = new Set<string>();

  $("h1, h2, h3, p, li, img, blockquote").each((_, el) => {
    const tag = el.tagName?.toLowerCase();

    if (tag === "img") {
      const src = $(el).attr("src");
      if (!src) return;
      const url = /^https?:\/\//i.test(src) ? src : `${siteOrigin}/${src.replace(/^\.?\//, "")}`;
      blocks.push({ type: "image", url, alt: clean($(el).attr("alt") ?? "") || undefined });
      return;
    }

    const text = clean($(el).text());
    // تجاهل الفارغ والمكرَّر: المتن المُرحَّل يكرّر بعض العناوين في أكثر من حاوية.
    if (!text || text.length < 2) return;
    const key = tag + "|" + text;
    if (seen.has(key)) return;
    seen.add(key);

    if (tag === "h1" || tag === "h2") blocks.push({ type: "heading", level: 2, text });
    else if (tag === "h3") blocks.push({ type: "heading", level: 3, text });
    else if (tag === "blockquote") blocks.push({ type: "quote", text });
    else if (tag === "li") {
      const last = blocks[blocks.length - 1];
      if (last?.type === "list") last.items.push(text);
      else blocks.push({ type: "list", items: [text] });
    } else blocks.push({ type: "paragraph", text });
  });

  return blocks;
}

export async function GET(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await ctx.params;
    const lang = new URL(req.url).searchParams.get("lang") === "en" ? "en" : "ar";

    const page = await prisma.page.findUnique({
      where: { slug },
      select: {
        slug: true, titleAr: true, titleEn: true,
        heroTitleAr: true, heroTitleEn: true, heroIntroAr: true, heroIntroEn: true,
        heroImage: true, bodyHtmlAr: true, bodyHtmlEn: true, status: true,
      },
    });
    if (!page || page.status !== "PUBLISHED") throw new ApiError(404, "الصفحة غير موجودة");

    const origin = new URL(req.url).origin;
    const html = (lang === "en" ? page.bodyHtmlEn : page.bodyHtmlAr) ?? "";

    return cors(req, ok({
      slug: page.slug,
      // عنوان الصفحة يحمل اسم الكلّية بعد الفاصل — نأخذ الشقّ الأوّل فقط.
      title: clean((lang === "en" ? page.titleEn : page.titleAr).split("|")[0]),
      heroTitle: clean((lang === "en" ? page.heroTitleEn : page.heroTitleAr) ?? "") || null,
      heroIntro: clean((lang === "en" ? page.heroIntroEn : page.heroIntroAr) ?? "") || null,
      heroImage: page.heroImage
        ? (/^https?:\/\//i.test(page.heroImage) ? page.heroImage : `${origin}/${page.heroImage.replace(/^\.?\//, "")}`)
        : null,
      blocks: extract(html, origin),
    }), "public");
  } catch (e) {
    return cors(req, fail(e), "public");
  }
}

export function OPTIONS(req: Request) {
  return preflight(req, "public", "GET, OPTIONS");
}
