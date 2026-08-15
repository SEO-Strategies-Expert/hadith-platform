/**
 * ربط أقسام الموقع العام بقاعدة البيانات.
 *
 * محتوى كل صفحة مخزَّن في Page.bodyHtmlAr/En (نصّ HTML كامل قابل للتحرير من اللوحة).
 * هذا الملف يحلّل ذلك النصّ عند التصيير (cheerio) ويستبدل حاويات محدّدة —
 * شرائح الهيرو، شريط الهيئة العلمية، مراحل التخصّص، الأخبار، الفعاليات،
 * الإصدارات، الأبحاث، المكتبة، المواقع البحثية — بمحتوًى مُصيَّر من الجداول،
 * فيصبح كل ما يُدخَل في لوحة التحكم ظاهرًا مباشرة في الواجهة.
 *
 * قاعدة السلامة: إذا كان الجدول فارغًا أو الحاوية غير موجودة، يُترك المحتوى
 * الثابت كما هو بدل إفراغ القسم.
 */
import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";
import { prisma } from "@/lib/prisma";
import type { Lang } from "@/lib/site-data";
import { siteHref } from "@/lib/site-links";
import { esc, isoDate, longDate, mediaUrl, searchText, shortDateParts } from "@/lib/site-format";
import { activateForm } from "@/lib/site-forms";

/* ------------------------------- عبارات ثابتة ------------------------------ */

const L = {
  ar: {
    arrow: "←",
    slide: "شريحة",
    slideOf: (i: number, n: number) => `${i} من ${n}`,
    featured: "خبر رئيس",
    readMore: "اقرأ الخبر كاملًا",
    stageCourses: "مقرّرات المرحلة",
    peerReviewed: "بحث محكَّم",
    issue: "عدد",
  },
  en: {
    arrow: "→",
    slide: "Slide",
    slideOf: (i: number, n: number) => `${i} of ${n}`,
    featured: "Featured",
    readMore: "Read the full story",
    stageCourses: "Stage courses",
    peerReviewed: "Peer-reviewed",
    issue: "Issue",
  },
} as const;

const FALLBACK_IMAGES = [
  "/assets/img/news-1.jpg",
  "/assets/img/news-2.jpg",
  "/assets/img/news-3.jpg",
  "/assets/img/news-4.jpg",
];

function fallbackImage(i: number): string {
  return FALLBACK_IMAGES[i % FALLBACK_IMAGES.length];
}

function icon(id: string): string {
  return `<svg aria-hidden="true"><use href="#${id}"/></svg>`;
}

/* ------------------------- بطاقة الصورة العامّة (image-card) ------------------------- */

interface CardData {
  href: string;
  image: string;
  title: string;
  desc?: string | null;
  tag?: string | null;
  foot?: string | null;
  external?: boolean;
}

function imageCard(c: CardData, lang: Lang): string {
  const t = L[lang];
  const target = c.external ? ` target="_blank" rel="noopener noreferrer"` : "";
  return (
    `<article class="image-card reveal" data-category="${esc(c.tag ?? "")}" ` +
    `data-search-text="${esc(searchText(c.title, c.desc, c.tag))}">` +
    `<a href="${esc(c.href)}"${target}>` +
    `<div class="thumb"><img src="${esc(c.image)}" alt="${esc(c.title)}" width="800" height="500" loading="lazy">` +
    (c.tag ? `<span class="tag">${esc(c.tag)}</span>` : "") +
    `</div>` +
    `<div class="body"><h3>${esc(c.title)}</h3>` +
    (c.desc ? `<p>${esc(c.desc)}</p>` : "") +
    `<div class="card-foot"><span>${esc(c.foot ?? "")}</span><strong>${t.arrow}</strong></div>` +
    `</div></a></article>`
  );
}

/* --------------------------------- الاستعلامات --------------------------------- */

const visibleOrder = { where: { visible: true }, orderBy: { order: "asc" as const } };

function newsQuery() {
  return prisma.newsItem.findMany({ where: { visible: true }, orderBy: [{ date: "desc" }] });
}

function eventsQuery() {
  return prisma.event.findMany({ where: { visible: true }, orderBy: [{ date: "asc" }, { order: "asc" }] });
}

/* ------------------------------ روابط داخل المحتوى ----------------------------- */

// روابط بطاقات مخزَّنة على شكل "news.html" تتحوّل إلى المسار الصحيح حسب اللغة.
function link(lang: Lang, href: string | null | undefined, fallback = "#"): string {
  const raw = (href ?? "").trim() || fallback;
  return siteHref(lang, raw);
}

function isExternal(href: string | null | undefined): boolean {
  return /^([a-z]+:)?\/\//i.test((href ?? "").trim());
}

/* =============================== روابط الصفحة ============================== */

/**
 * تطبيع كل الروابط والصور النسبية داخل المحتوى المخزَّن.
 * ضروري للنسخة الإنجليزية: مسار الرئيسية "/en" بلا شرطة نهائية، فالرابط
 * النسبي "news.html" كان يُحلّ إلى "/news.html" (الصفحة العربية).
 */
function normalizeUrls($: CheerioAPI, lang: Lang): void {
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    if (!href || href.startsWith("#") || /^([a-z]+:)?\/\//i.test(href)) return;
    if (/^(mailto:|tel:|javascript:|data:)/i.test(href)) return;
    if (href.startsWith("/")) return;
    $(el).attr("href", siteHref(lang, href.replace(/^(\.\.\/)+/, "").replace(/^\.\//, "")));
  });

  $("img[src], source[src], video[src], iframe[src]").each((_, el) => {
    const src = $(el).attr("src") ?? "";
    if (!src) return;
    const norm = mediaUrl(src);
    if (norm && norm !== src) $(el).attr("src", norm);
  });

  $("[srcset]").each((_, el) => {
    const val = $(el).attr("srcset") ?? "";
    if (!val) return;
    const norm = val
      .split(",")
      .map((part) => {
        const [u, ...rest] = part.trim().split(/\s+/);
        return [mediaUrl(u), ...rest].join(" ");
      })
      .join(", ");
    if (norm !== val) $(el).attr("srcset", norm);
  });
}

/* ================================ رابطو الأقسام =============================== */

export type PageParams = Record<string, string | undefined>;

type Binder = ($: CheerioAPI, lang: Lang, params?: PageParams) => Promise<void>;

/** شرائح الهيرو في الرئيسية ← جدول HeroSlide. */
const bindHeroSlides: Binder = async ($, lang) => {
  const stage = $("#heroStage");
  if (stage.length === 0) return;
  const slides = await prisma.heroSlide.findMany(visibleOrder);
  if (slides.length === 0) return;

  const t = L[lang];
  const html = slides
    .map((s, i) => {
      const src = mediaUrl(lang === "ar" ? s.imageAr : s.imageEn);
      const alt = (lang === "ar" ? s.altAr : s.altEn) ?? "";
      const priority = i === 0 ? ` fetchpriority="high"` : ` loading="lazy"`;
      return (
        `<div class="slide${i === 0 ? " is-active" : ""}" role="group" aria-roledescription="${t.slide}" ` +
        `aria-label="${t.slideOf(i + 1, slides.length)}">` +
        `<img src="${esc(src)}" alt="${esc(alt)}" width="1672" height="941"${priority}>` +
        `</div>`
      );
    })
    .join("");

  stage.find(".slide").remove();
  const nav = stage.find(".hero-nav");
  if (nav.length > 0) nav.before(html);
  else stage.prepend(html);
};

/** شريط الهيئة العلمية في الرئيسية ← جدول Scholar. */
const bindFacultyRail: Binder = async ($, lang) => {
  const rail = $("#facultyRail");
  if (rail.length === 0) return;
  const rows = await prisma.scholar.findMany(visibleOrder);
  if (rows.length === 0) return;

  const html = rows
    .map((s, i) => {
      const photo = mediaUrl(s.photoUrl, fallbackImage(i));
      const rank = (lang === "ar" ? s.rankAr : s.rankEn) ?? "";
      const name = lang === "ar" ? s.nameAr : s.nameEn;
      const spec = (lang === "ar" ? s.specAr : s.specEn) ?? "";
      return (
        `<li class="person reveal">` +
        `<div class="person-photo"><img src="${esc(photo)}" alt="" loading="lazy" width="520" height="650"></div>` +
        `<div class="person-body">` +
        `<span class="person-rank">${esc(rank)}</span>` +
        `<b>${esc(name)}</b>` +
        `<span class="person-spec">${esc(spec)}</span>` +
        `</div></li>`
      );
    })
    .join("");

  rail.html(html);
};

/** مسار مراحل التخصّص في الرئيسية ← جدول ProgramStage. */
const bindTrack: Binder = async ($, lang) => {
  const track = $("ol.track");
  if (track.length === 0) return;
  const rows = await prisma.programStage.findMany(visibleOrder);
  if (rows.length === 0) return;

  const t = L[lang];
  const html = rows
    .map((s) => {
      const items = (s.items ?? null) as { ar?: string[]; en?: string[] } | null;
      const list = (lang === "ar" ? items?.ar : items?.en) ?? [];
      const num = (lang === "ar" ? s.numAr : s.numEn) ?? "";
      const meta = (lang === "ar" ? s.metaAr : s.metaEn) ?? "";
      const title = lang === "ar" ? s.titleAr : s.titleEn;
      const desc = (lang === "ar" ? s.descAr : s.descEn) ?? "";
      return (
        `<li class="track-item reveal">` +
        `<span class="track-dot">${icon(s.icon || "i-stage")}</span>` +
        `<div class="track-card">` +
        `<div class="track-top"><span class="track-num">${esc(num)}</span><span class="track-meta">${esc(meta)}</span></div>` +
        `<h3>${esc(title)}</h3>` +
        (desc ? `<p>${esc(desc)}</p>` : "") +
        (list.length
          ? `<ul class="track-list">${list.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`
          : "") +
        `<a class="more" href="${esc(link(lang, s.moreHref, "programs.html"))}">${t.stageCourses} ${icon("i-arrow")}</a>` +
        `</div></li>`
      );
    })
    .join("");

  track.html(html);
};

/** قسم الأخبار في الرئيسية (الخبر الرئيس + قائمة الأخبار) ← جدول NewsItem. */
const bindHomeNews: Binder = async ($, lang) => {
  const grid = $(".news-grid");
  if (grid.length === 0) return;
  const rows = await newsQuery();
  if (rows.length === 0) return;

  const t = L[lang];
  const lead = rows.find((n) => n.featured) ?? rows[0];
  const rest = rows.filter((n) => n.id !== lead.id).slice(0, 4);

  const leadEl = grid.find("article.news-lead");
  if (leadEl.length > 0) {
    const title = lang === "ar" ? lead.titleAr : lead.titleEn;
    const excerpt = (lang === "ar" ? lead.excerptAr : lead.excerptEn) ?? "";
    const img = mediaUrl(lead.imageUrl, "/assets/img/news-lead.jpg");
    leadEl.html(
      `<a href="${esc(newsHref(lang, lead))}">` +
        `<div class="news-lead-media"><img src="${esc(img)}" alt="" loading="lazy" width="1200" height="700"></div>` +
        `<div class="news-lead-body">` +
        `<div class="news-meta"><span class="badge">${esc((lang === "ar" ? lead.tagAr : lead.tagEn) || t.featured)}</span>` +
        `<time datetime="${isoDate(lead.date)}">${esc(longDate(lead.date, lang, { arabicDigits: true }))}</time></div>` +
        `<h3>${esc(title)}</h3>` +
        (excerpt ? `<p>${esc(excerpt)}</p>` : "") +
        `<span class="more">${t.readMore} ${icon("i-arrow")}</span>` +
        `</div></a>`
    );
  }

  const list = grid.find("ul.news-list");
  if (list.length > 0 && rest.length > 0) {
    list.html(
      rest
        .map((n, i) => {
          const title = lang === "ar" ? n.titleAr : n.titleEn;
          const tag = (lang === "ar" ? n.tagAr : n.tagEn) ?? "";
          const img = mediaUrl(n.imageUrl, fallbackImage(i));
          return (
            `<li class="reveal"><a href="${esc(newsHref(lang, n))}">` +
            `<img src="${esc(img)}" alt="" loading="lazy" width="480" height="320">` +
            `<div><div class="news-meta">` +
            (tag ? `<span class="tag">${esc(tag)}</span>` : "") +
            `<time datetime="${isoDate(n.date)}">${esc(longDate(n.date, lang, { year: false, arabicDigits: true }))}</time>` +
            `</div><h4>${esc(title)}</h4></div></a></li>`
          );
        })
        .join("")
    );
  }
};

/** تقويم الفعاليات القادمة في الرئيسية ← جدول Event. */
const bindAgenda: Binder = async ($, lang) => {
  const list = $("ul.agenda-list");
  if (list.length === 0) return;
  const rows = await eventsQuery();
  if (rows.length === 0) return;

  list.html(
    rows
      .slice(0, 4)
      .map((e) => {
        const { d, m } = shortDateParts(e.date, lang);
        const title = lang === "ar" ? e.titleAr : e.titleEn;
        const desc = (lang === "ar" ? e.descAr : e.descEn) ?? "";
        const when = (lang === "ar" ? e.whenAr : e.whenEn) ?? "";
        return (
          `<li><span class="date"><b>${esc(d)}</b><i>${esc(m)}</i></span>` +
          `<div><b>${esc(title)}</b>` +
          (desc ? `<span>${esc(desc)}</span>` : "") +
          (when ? `<span class="when">${esc(when)}</span>` : "") +
          `</div></li>`
        );
      })
      .join("")
  );
};

/* ------------------------------- صفحة الأخبار ------------------------------- */

function newsHref(lang: Lang, n: { slug: string | null; id: string }): string {
  const q = n.slug ? `?item=${encodeURIComponent(n.slug)}` : `?item=${n.id}`;
  return siteHref(lang, "news-detail.html") + q;
}

/** صدر صفحة الأخبار: الخبر الأبرز + المصغّرات الجانبية. */
const bindNewsFeature: Binder = async ($, lang) => {
  const feature = $(".news-feature");
  if (feature.length === 0) return;
  const rows = await newsQuery();
  if (rows.length === 0) return;

  const lead = rows.find((n) => n.featured) ?? rows[0];
  const rest = rows.filter((n) => n.id !== lead.id).slice(0, 4);

  const leadEl = feature.find("a.lead");
  if (leadEl.length > 0) {
    const title = lang === "ar" ? lead.titleAr : lead.titleEn;
    const excerpt = (lang === "ar" ? lead.excerptAr : lead.excerptEn) ?? "";
    const tag = (lang === "ar" ? lead.tagAr : lead.tagEn) ?? "";
    leadEl.attr("href", newsHref(lang, lead));
    leadEl.html(
      `<img src="${esc(mediaUrl(lead.imageUrl, "/assets/img/news-lead.jpg"))}" alt="${esc(title)}" loading="lazy">` +
        `<div class="lead-copy">` +
        (tag ? `<span class="page-kicker">${esc(tag)}</span>` : "") +
        `<h2>${esc(title)}</h2>` +
        (excerpt ? `<p>${esc(excerpt)}</p>` : "") +
        `</div>`
    );
  }

  const side = feature.find(".side");
  if (side.length > 0 && rest.length > 0) {
    side.html(
      rest
        .map((n, i) => {
          const title = lang === "ar" ? n.titleAr : n.titleEn;
          const excerpt = (lang === "ar" ? n.excerptAr : n.excerptEn) ?? "";
          return (
            `<a class="news-mini reveal" href="${esc(newsHref(lang, n))}">` +
            `<img src="${esc(mediaUrl(n.imageUrl, fallbackImage(i)))}" alt="${esc(title)}">` +
            `<div><h3>${esc(title)}</h3>` +
            (excerpt ? `<p>${esc(excerpt)}</p>` : "") +
            `</div></a>`
          );
        })
        .join("")
    );
  }
};

/** شبكة كل الأخبار في صفحة الأخبار. */
const bindNewsList: Binder = async ($, lang) => {
  const grid = $("#news-list .card-grid");
  if (grid.length === 0) return;
  const rows = await newsQuery();
  if (rows.length === 0) return;

  grid.html(
    rows
      .map((n, i) =>
        imageCard(
          {
            href: newsHref(lang, n),
            image: mediaUrl(n.imageUrl, fallbackImage(i)),
            title: lang === "ar" ? n.titleAr : n.titleEn,
            desc: lang === "ar" ? n.excerptAr : n.excerptEn,
            tag: lang === "ar" ? n.tagAr : n.tagEn,
            foot: longDate(n.date, lang),
          },
          lang
        )
      )
      .join("")
  );
};

/* ------------------------------ صفحة الهيئة العلمية ----------------------------- */

const bindProfileGrid: Binder = async ($, lang) => {
  const grid = $(".profile-grid");
  if (grid.length === 0) return;
  const rows = await prisma.scholar.findMany(visibleOrder);
  if (rows.length === 0) return;

  grid.html(
    rows
      .map((s, i) => {
        const name = lang === "ar" ? s.nameAr : s.nameEn;
        const rank = (lang === "ar" ? s.rankAr : s.rankEn) ?? "";
        const bio = (lang === "ar" ? s.bioAr : s.bioEn) || (lang === "ar" ? s.specAr : s.specEn) || "";
        return (
          `<article class="profile-card reveal">` +
          `<div class="portrait"><img src="${esc(mediaUrl(s.photoUrl, fallbackImage(i)))}" alt="${esc(name)}" loading="lazy">` +
          (rank ? `<span class="profile-role">${esc(rank)}</span>` : "") +
          `</div>` +
          `<div class="body"><h3>${esc(name)}</h3>` +
          (bio ? `<p>${esc(bio)}</p>` : "") +
          `</div></article>`
        );
      })
      .join("")
  );
};

/* -------------------------------- الإصدارات -------------------------------- */

/** بطاقات أحدث الإصدارات في صفحة الإصدارات ← جدول JournalIssue. */
/** غلاف عدد المجلّة — نفس ترميز `.issue` المستعمل في الرئيسية. */
function issueCover(
  r: {
    nameAr: string; nameEn: string;
    subAr: string | null; subEn: string | null;
    noAr: string | null; noEn: string | null;
    dateAr: string | null; dateEn: string | null;
    tagAr: string | null; tagEn: string | null;
    isNew: boolean;
  },
  lang: Lang,
  i: number
): string {
  const name = lang === "ar" ? r.nameAr : r.nameEn;
  const sub = lang === "ar" ? r.subAr : r.subEn;
  const no = lang === "ar" ? r.noAr : r.noEn;
  const date = lang === "ar" ? r.dateAr : r.dateEn;
  const tag = lang === "ar" ? r.tagAr : r.tagEn;
  // الغلاف الثاني بتدرّج مختلف كما في الرئيسية، والاسم بخطّ الثلث في العربية فقط.
  const cover = i % 2 === 1 ? "issue-cover cover-2" : "issue-cover";
  const nameCls = lang === "ar" ? "issue-name thuluth" : "issue-name";
  return (
    `<article class="issue${r.isNew ? " issue-new" : ""} reveal">` +
    `<div class="${cover}">` +
    `<span class="issue-orn" aria-hidden="true"></span>` +
    `<span class="${nameCls}">${esc(name)}</span>` +
    (sub ? `<span class="issue-sub">${esc(sub)}</span>` : "") +
    (no ? `<span class="issue-no">${esc(no)}</span>` : "") +
    (date ? `<span class="issue-date">${esc(date)}</span>` : "") +
    `</div>` +
    (tag ? `<span class="issue-tag${r.isNew ? "" : " muted"}">${esc(tag)}</span>` : "") +
    `</article>`
  );
}

const bindIssues: Binder = async ($, lang) => {
  const grid = $(".card-grid").first();
  if (grid.length === 0) return;
  const rows = await prisma.journalIssue.findMany(visibleOrder);
  if (rows.length === 0) return;

  // الحاوية كانت شبكة بطاقات عامّة؛ نحوّلها إلى شبكة الأغلفة نفسها المستعملة
  // في الرئيسية حتى ينطبق تنسيق الغلاف (.issues / .issue-cover).
  grid.removeClass("card-grid two three four").addClass("issues");
  grid.html(rows.map((r, i) => issueCover(r, lang, i)).join(""));
};

/** فهرس الأبحاث المحكّمة ← جدول Paper. */
const bindPapers: Binder = async ($, lang) => {
  const grid = $("#research-list .card-grid");
  if (grid.length === 0) return;
  const rows = await prisma.paper.findMany(visibleOrder);
  if (rows.length === 0) return;

  const t = L[lang];
  grid.html(
    rows
      .map((p, i) =>
        imageCard(
          {
            href: link(lang, p.fileUrl, "#"),
            image: mediaUrl(p.imageUrl, fallbackImage(i)),
            title: lang === "ar" ? p.titleAr : p.titleEn,
            desc: lang === "ar" ? p.metaAr : p.metaEn,
            tag: (lang === "ar" ? p.tagAr : p.tagEn) || p.no || "",
            foot: t.peerReviewed,
            external: isExternal(p.fileUrl),
          },
          lang
        )
      )
      .join("")
  );
};

/* ----------------------------- المكتبة والمصادر ----------------------------- */

function resourceCards(
  rows: {
    id: string;
    nameAr: string;
    nameEn: string;
    descAr: string | null;
    descEn: string | null;
    icon: string | null;
    url: string | null;
    category: string | null;
  }[],
  lang: Lang
): string {
  return rows
    .map((r) => {
      const name = lang === "ar" ? r.nameAr : r.nameEn;
      const desc = (lang === "ar" ? r.descAr : r.descEn) ?? "";
      const badge = r.icon || name.trim().slice(0, 2);
      const title = r.url
        ? `<h3><a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(name)}</a></h3>`
        : `<h3>${esc(name)}</h3>`;
      return (
        `<article class="resource-card" data-category="${esc(r.category ?? "")}" ` +
        `data-search-text="${esc(searchText(name, desc, r.category))}">` +
        `<div class="resource-logo">${esc(badge)}</div>` +
        `<div>${title}${desc ? `<p>${esc(desc)}</p>` : ""}</div>` +
        `</article>`
      );
    })
    .join("");
}

const bindLibraryGrid: Binder = async ($, lang) => {
  const grid = $("#library-grid");
  if (grid.length === 0) return;
  const rows = await prisma.libraryResource.findMany({
    where: { active: true },
    orderBy: [{ featured: "desc" }, { order: "asc" }],
  });
  if (rows.length === 0) return;
  grid.html(resourceCards(rows, lang));
};

const bindSiteGrid: Binder = async ($, lang) => {
  const grid = $("#site-grid");
  if (grid.length === 0) return;
  const rows = await prisma.libraryResource.findMany({
    where: { active: true },
    orderBy: [{ featured: "desc" }, { order: "asc" }],
  });
  if (rows.length === 0) return;
  grid.html(resourceCards(rows, lang));
};

/* --------------------------------- الديوان --------------------------------- */

/** «اللقاءات القادمة» في صفحة الديوان ← جدول Event. */
const bindDiwanEvents: Binder = async ($, lang) => {
  const grid = $("#diwan-events .card-grid");
  if (grid.length === 0) return;
  const rows = await eventsQuery();
  if (rows.length === 0) return;

  grid.html(
    rows
      .map((e, i) =>
        imageCard(
          {
            href: link(lang, e.href, "#"),
            image: mediaUrl(e.imageUrl, fallbackImage(i)),
            title: lang === "ar" ? e.titleAr : e.titleEn,
            desc: lang === "ar" ? e.descAr : e.descEn,
            tag: lang === "ar" ? e.tagAr : e.tagEn,
            foot: (lang === "ar" ? e.whenAr : e.whenEn) || longDate(e.date, lang),
            external: isExternal(e.href),
          },
          lang
        )
      )
      .join("")
  );
};

/* --------------------------- صفحة الدورات العلمية --------------------------- */

/**
 * بطاقات «الدورات المتاحة» ← جدول Course للمقرّرات غير المرتبطة بمرحلة.
 * (المقرّرات المرتبطة بمرحلة تخصّ خطّة المرحلة، فلا تُعرض هنا.)
 */
const bindCourses: Binder = async ($, lang) => {
  const grid = $("#courseGrid .card-grid");
  if (grid.length === 0) return;
  const rows = await prisma.course.findMany({
    where: { visible: true, stageId: null },
    orderBy: { order: "asc" },
  });
  if (rows.length === 0) return;

  grid.html(
    rows
      .map((c, i) =>
        imageCard(
          {
            href: link(lang, c.href, "#"),
            image: mediaUrl(c.imageUrl, fallbackImage(i)),
            title: lang === "ar" ? c.titleAr : c.titleEn,
            desc: lang === "ar" ? c.descAr : c.descEn,
            tag: c.category,
            foot: lang === "ar" ? c.metaAr : c.metaEn,
            external: isExternal(c.href),
          },
          lang
        )
      )
      .join("")
  );
};

/* ------------------- قوائم محتوى الصفحات الداخلية (جداول عامّة) ------------------- */

/** أول شبكة بطاقات تحتوي بطاقات صور — لتجنّب شبكات البطاقات التعريفية (info-card). */
function imageCardGrid($: CheerioAPI) {
  const grids = $(".card-grid").filter((_, el) => $(el).find("article.image-card").length > 0);
  return grids.first();
}

/** بطاقات الشبكة في صفحةٍ ما ← جدول ContentCard حسب مفتاح القسم. */
function cardsBinder(section: string): Binder {
  return async ($, lang) => {
    const grid = imageCardGrid($);
    if (grid.length === 0) return;
    const rows = await prisma.contentCard.findMany({
      where: { section, visible: true },
      orderBy: { order: "asc" },
    });
    if (rows.length === 0) return;

    grid.html(
      rows
        .map((c, i) =>
          imageCard(
            {
              href: link(lang, c.href, "#"),
              image: mediaUrl(c.imageUrl, fallbackImage(i)),
              title: lang === "ar" ? c.titleAr : c.titleEn,
              desc: lang === "ar" ? c.descAr : c.descEn,
              tag: lang === "ar" ? c.tagAr : c.tagEn,
              foot: lang === "ar" ? c.metaAr : c.metaEn,
              external: isExternal(c.href),
            },
            lang
          )
        )
        .join("")
    );
  };
}

/** الأسئلة الشائعة ← جدول Faq. */
function faqBinder(section: string): Binder {
  return async ($, lang) => {
    const box = $(".accordion").first();
    if (box.length === 0) return;
    const rows = await prisma.faq.findMany({
      where: { section, visible: true },
      orderBy: { order: "asc" },
    });
    if (rows.length === 0) return;

    box.html(
      rows
        .map(
          (f) =>
            `<details><summary>${esc(lang === "ar" ? f.questionAr : f.questionEn)}</summary>` +
            `<div class="answer">${esc(lang === "ar" ? f.answerAr : f.answerEn)}</div></details>`
        )
        .join("")
    );
  };
}

/** الخط الزمني للمسار ← جدول ProcessStep. */
function stepsBinder(section: string): Binder {
  return async ($, lang) => {
    const box = $(".timeline").first();
    if (box.length === 0) return;
    const rows = await prisma.processStep.findMany({
      where: { section, visible: true },
      orderBy: { order: "asc" },
    });
    if (rows.length === 0) return;

    box.html(
      rows
        .map((s, i) => {
          const desc = lang === "ar" ? s.descAr : s.descEn;
          return (
            `<article class="timeline-item"><span class="step">${i + 1}</span>` +
            `<h3>${esc(lang === "ar" ? s.titleAr : s.titleEn)}</h3>` +
            (desc ? `<p>${esc(desc)}</p>` : "") +
            `</article>`
          );
        })
        .join("")
    );
  };
}

/** جدول «وثيقة الاعتماد» (بند/قيمة) ← جدول InfoRow. */
const bindInfoRows: Binder = async ($, lang) => {
  const table = $(".data-table").first();
  if (table.length === 0) return;
  const rows = await prisma.infoRow.findMany({
    where: { section: "accreditation", visible: true },
    orderBy: { order: "asc" },
  });
  if (rows.length === 0) return;

  const body = table.find("tbody").length > 0 ? table.find("tbody") : table;
  body.html(
    rows
      .map(
        (r) =>
          `<tr><th>${esc(lang === "ar" ? r.labelAr : r.labelEn)}</th>` +
          `<td>${esc((lang === "ar" ? r.valueAr : r.valueEn) ?? "")}</td></tr>`
      )
      .join("")
  );
};

/** جدول الخطة الدراسية ← جدول CurriculumRow. */
const bindCurriculum: Binder = async ($, lang) => {
  const table = $(".data-table").first();
  if (table.length === 0) return;
  const rows = await prisma.curriculumRow.findMany({
    where: { visible: true },
    orderBy: { order: "asc" },
  });
  if (rows.length === 0) return;

  const cell = (ar: string | null, en: string | null) => `<td>${esc((lang === "ar" ? ar : en) ?? "")}</td>`;
  const body = table.find("tbody").length > 0 ? table.find("tbody") : table;
  body.html(
    rows
      .map(
        (r) =>
          `<tr><td>${esc(lang === "ar" ? r.stageAr : r.stageEn)}</td>` +
          cell(r.axesAr, r.axesEn) +
          cell(r.practiceAr, r.practiceEn) +
          cell(r.outcomeAr, r.outcomeEn) +
          `</tr>`
      )
      .join("")
  );
};

/* --------------------------- شبكة الفعاليات في الأخبار --------------------------- */

const bindNewsEvents: Binder = async ($, lang) => {
  const grid = $("#events .card-grid, #news-events .card-grid");
  if (grid.length === 0) return;
  const rows = await eventsQuery();
  if (rows.length === 0) return;
  grid.html(
    rows
      .map((e, i) =>
        imageCard(
          {
            href: link(lang, e.href, "#"),
            image: mediaUrl(e.imageUrl, fallbackImage(i)),
            title: lang === "ar" ? e.titleAr : e.titleEn,
            desc: lang === "ar" ? e.descAr : e.descEn,
            tag: lang === "ar" ? e.tagAr : e.tagEn,
            foot: (lang === "ar" ? e.whenAr : e.whenEn) || longDate(e.date, lang),
          },
          lang
        )
      )
      .join("")
  );
};

/* ------------------------------- تفاصيل الخبر ------------------------------- */

/** يحوّل نصّ التفاصيل المخزَّن إلى فقرات إن لم يكن HTML أصلًا. */
function bodyToHtml(body: string): string {
  if (/<[a-z][\s\S]*>/i.test(body)) return body;
  return body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p style="font-size:19px;line-height:2.1;color:var(--ink-soft)">${esc(p)}</p>`)
    .join("");
}

/** صفحة «تفاصيل الخبر» ← عنصر NewsItem المحدَّد في ?item=. */
const bindNewsDetail: Binder = async ($, lang, params) => {
  const key = (params?.item ?? "").trim();
  if (!key) return;
  const item =
    (await prisma.newsItem.findFirst({ where: { slug: key, visible: true } })) ??
    (await prisma.newsItem.findFirst({ where: { id: key, visible: true } }));
  if (!item) return;

  const title = lang === "ar" ? item.titleAr : item.titleEn;
  const excerpt = (lang === "ar" ? item.excerptAr : item.excerptEn) ?? "";
  const tag = (lang === "ar" ? item.tagAr : item.tagEn) ?? "";
  const body = (lang === "ar" ? item.bodyAr : item.bodyEn) ?? "";
  const image = mediaUrl(item.imageUrl, "/assets/img/news-lead.jpg");

  $("img.hero-bg").attr("src", image);
  $(".breadcrumbs strong").text(title);
  if (tag) $(".page-hero .page-kicker").text(tag);
  $(".page-hero .page-title").text(title);
  if (excerpt) $(".page-hero .page-intro").text(excerpt);
  $(".page-hero .page-meta").html(
    `<span>${esc(longDate(item.date, lang))}</span>` + (tag ? `<span>${esc(tag)}</span>` : "")
  );
  // بلا تفاصيل مكتوبة يُعرض الملخّص — لا يجوز إبقاء نصّ الخبر الثابت تحت عنوان خبرٍ آخر.
  const article = body || excerpt;
  if (article) $(".inner-section article").first().html(bodyToHtml(article));
};

/* ================================ سجلّ الرابطين =============================== */

const BINDERS: Record<string, Binder[]> = {
  "news-detail": [bindNewsDetail],
  index: [bindHeroSlides, bindFacultyRail, bindTrack, bindHomeNews, bindAgenda],
  news: [bindNewsFeature, bindNewsList, bindNewsEvents],
  faculty: [bindProfileGrid],
  "advisory-board": [bindProfileGrid],
  publications: [bindIssues],
  "published-research": [bindPapers],
  courses: [bindCourses],
  library: [bindLibraryGrid],
  "hadith-research-sites": [bindSiteGrid],
  diwan: [bindDiwanEvents],

  // قوائم الصفحات الداخلية
  programs: [cardsBinder("programs")],
  ijazat: [cardsBinder("ijazat")],
  "paid-books": [cardsBinder("paid-books")],
  research: [cardsBinder("research")],
  admissions: [stepsBinder("admissions"), faqBinder("admissions")],
  "publication-rules": [faqBinder("publication-rules")],
  accreditation: [bindInfoRows],
  curricula: [bindCurriculum],
};

// صفحة الإصدارات تجمع بطاقات الأعداد وخطّ مسار النشر.
BINDERS.publications.push(stepsBinder("publications"));

/**
 * ينفّذ رابطي القسم على محتوى الصفحة المخزَّن ثم يطبّع الروابط.
 * يُنفَّذ دائمًا (حتى للصفحات بلا رابطين) لأن التطبيع نفسه مطلوب في كل صفحة.
 */
export async function bindPageSections(
  html: string,
  slug: string,
  lang: Lang,
  params?: PageParams
): Promise<string> {
  if (!html) return html;
  const binders = BINDERS[slug] ?? [];
  const $ = cheerio.load(html, null, false);

  for (const bind of binders) {
    try {
      await bind($, lang, params);
    } catch (e) {
      // قسمٌ واحدٌ فاشلٌ لا يُسقط الصفحة — يبقى محتواه الثابت.
      console.error(`[site-sections] فشل ربط قسم في «${slug}»:`, e);
    }
  }

  // نماذج الزوّار (تواصل / التحاق / إرسال بحث) تُحوَّل إلى نماذج حقيقية تحفظ في DB.
  activateForm($, slug, lang, siteHref(lang, `${slug}.html`), params);

  normalizeUrls($, lang);
  return $.html();
}
