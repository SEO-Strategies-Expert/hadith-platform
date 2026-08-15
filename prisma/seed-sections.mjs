/**
 * نقل قوائم الصفحات الداخلية من نصّ الصفحة إلى جداولها الجديدة.
 *
 * يقرأ المحتوى الحالي المخزَّن (عربي/إنجليزي) ويستخرج منه الصفوف كما هي،
 * فتظهر الصفحات بعد الربط بلا أي تغيير في المظهر، ويصبح تحريرها من اللوحة.
 *
 * آمنٌ للتكرار: لا يكتب في قسمٍ فيه صفوف بالفعل (لا يمسح شيئًا أبدًا).
 * التشغيل:  node prisma/seed-sections.mjs [--dry]
 */
import { PrismaClient } from "@prisma/client";
import * as cheerio from "cheerio";

const prisma = new PrismaClient();
const DRY = process.argv.includes("--dry");

const clean = (s) => (s ?? "").replace(/\s+/g, " ").trim();

async function pageDoc(slug) {
  const page = await prisma.page.findUnique({ where: { slug } });
  if (!page) return null;
  return {
    ar: cheerio.load(page.bodyHtmlAr || "", null, false),
    en: cheerio.load(page.bodyHtmlEn || "", null, false),
  };
}

/** يطابق عناصر النسختين بالترتيب ويستخرج منها صفوفًا ثنائية اللغة. */
function zip(doc, selector, extract) {
  const arEls = doc.ar(selector).toArray();
  const enEls = doc.en(selector).toArray();
  return arEls.map((el, i) => ({
    ar: extract(doc.ar, el),
    en: enEls[i] ? extract(doc.en, enEls[i]) : extract(doc.ar, el),
  }));
}

const CARD_SECTIONS = ["programs", "ijazat", "paid-books", "research"];

function firstImageGrid($) {
  return $(".card-grid").filter((_, el) => $(el).find("article.image-card").length > 0).first();
}

async function seedCards(section) {
  const existing = await prisma.contentCard.count({ where: { section } });
  if (existing > 0) return `cards:${section} — موجود (${existing})`;
  const doc = await pageDoc(section);
  if (!doc) return `cards:${section} — لا صفحة`;

  const gridAr = firstImageGrid(doc.ar);
  const gridEn = firstImageGrid(doc.en);
  const arCards = gridAr.find("article.image-card").toArray();
  const enCards = gridEn.find("article.image-card").toArray();

  const pick = ($, el) => {
    const $c = $(el);
    return {
      title: clean($c.find("h3").first().text()),
      desc: clean($c.find(".body p").first().text()),
      tag: clean($c.find(".thumb .tag").first().text()),
      meta: clean($c.find(".card-foot span").first().text()),
      href: $c.find("a").first().attr("href") ?? null,
      image: $c.find("img").first().attr("src") ?? null,
    };
  };

  const rows = arCards.map((el, i) => {
    const a = pick(doc.ar, el);
    const e = enCards[i] ? pick(doc.en, enCards[i]) : a;
    return {
      section,
      titleAr: a.title,
      titleEn: e.title || a.title,
      descAr: a.desc || null,
      descEn: e.desc || null,
      tagAr: a.tag || null,
      tagEn: e.tag || null,
      metaAr: a.meta || null,
      metaEn: e.meta || null,
      href: a.href,
      imageUrl: a.image,
      order: i,
    };
  });
  if (rows.length === 0) return `cards:${section} — لا بطاقات`;
  if (!DRY) await prisma.contentCard.createMany({ data: rows });
  return `cards:${section} — ${rows.length}`;
}

async function seedFaq(section) {
  const existing = await prisma.faq.count({ where: { section } });
  if (existing > 0) return `faq:${section} — موجود (${existing})`;
  const doc = await pageDoc(section);
  if (!doc) return `faq:${section} — لا صفحة`;

  const pairs = zip(doc, ".accordion details", ($, el) => ({
    q: clean($(el).find("summary").first().text()),
    a: clean($(el).find(".answer").first().text()),
  }));
  const rows = pairs
    .filter((p) => p.ar.q)
    .map((p, i) => ({
      section,
      questionAr: p.ar.q,
      questionEn: p.en.q || p.ar.q,
      answerAr: p.ar.a,
      answerEn: p.en.a || p.ar.a,
      order: i,
    }));
  if (rows.length === 0) return `faq:${section} — لا أسئلة`;
  if (!DRY) await prisma.faq.createMany({ data: rows });
  return `faq:${section} — ${rows.length}`;
}

async function seedSteps(section) {
  const existing = await prisma.processStep.count({ where: { section } });
  if (existing > 0) return `steps:${section} — موجود (${existing})`;
  const doc = await pageDoc(section);
  if (!doc) return `steps:${section} — لا صفحة`;

  const pairs = zip(doc, ".timeline .timeline-item", ($, el) => ({
    t: clean($(el).find("h3").first().text()),
    d: clean($(el).find("p").first().text()),
  }));
  const rows = pairs
    .filter((p) => p.ar.t)
    .map((p, i) => ({
      section,
      titleAr: p.ar.t,
      titleEn: p.en.t || p.ar.t,
      descAr: p.ar.d || null,
      descEn: p.en.d || null,
      order: i,
    }));
  if (rows.length === 0) return `steps:${section} — لا خطوات`;
  if (!DRY) await prisma.processStep.createMany({ data: rows });
  return `steps:${section} — ${rows.length}`;
}

async function seedInfoRows() {
  const section = "accreditation";
  const existing = await prisma.infoRow.count({ where: { section } });
  if (existing > 0) return `info:${section} — موجود (${existing})`;
  const doc = await pageDoc(section);
  if (!doc) return `info:${section} — لا صفحة`;

  const pairs = zip(doc, ".data-table tbody tr", ($, el) => ({
    l: clean($(el).find("th").first().text()),
    v: clean($(el).find("td").first().text()),
  }));
  const rows = pairs
    .filter((p) => p.ar.l)
    .map((p, i) => ({
      section,
      labelAr: p.ar.l,
      labelEn: p.en.l || p.ar.l,
      valueAr: p.ar.v || null,
      valueEn: p.en.v || null,
      order: i,
    }));
  if (rows.length === 0) return `info:${section} — لا بنود`;
  if (!DRY) await prisma.infoRow.createMany({ data: rows });
  return `info:${section} — ${rows.length}`;
}

async function seedCurriculum() {
  const existing = await prisma.curriculumRow.count();
  if (existing > 0) return `curriculum — موجود (${existing})`;
  const doc = await pageDoc("curricula");
  if (!doc) return "curriculum — لا صفحة";

  const pairs = zip(doc, ".data-table tbody tr", ($, el) =>
    $(el)
      .find("td")
      .toArray()
      .map((td) => clean($(td).text()))
  );
  const rows = pairs
    .filter((p) => p.ar[0])
    .map((p, i) => ({
      stageAr: p.ar[0],
      stageEn: p.en[0] || p.ar[0],
      axesAr: p.ar[1] ?? null,
      axesEn: p.en[1] ?? null,
      practiceAr: p.ar[2] ?? null,
      practiceEn: p.en[2] ?? null,
      outcomeAr: p.ar[3] ?? null,
      outcomeEn: p.en[3] ?? null,
      order: i,
    }));
  if (rows.length === 0) return "curriculum — لا صفوف";
  if (!DRY) await prisma.curriculumRow.createMany({ data: rows });
  return `curriculum — ${rows.length}`;
}

const results = [];
for (const s of CARD_SECTIONS) results.push(await seedCards(s));
for (const s of ["admissions", "publication-rules"]) results.push(await seedFaq(s));
for (const s of ["admissions", "publications"]) results.push(await seedSteps(s));
results.push(await seedInfoRows());
results.push(await seedCurriculum());

console.log(DRY ? "— تجربة بلا كتابة —" : "— تمّت الكتابة —");
for (const r of results) console.log("  " + r);
await prisma.$disconnect();
