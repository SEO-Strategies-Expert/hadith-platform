// ==========================================================================
// سكربت الترحيل — يستخرج محتوى الموقع الثابت الحالي إلى قاعدة البيانات.
//   node prisma/import.mjs         → ترحيل فعلي (يحتاج DATABASE_URL)
//   node prisma/import.mjs --dry   → تحقّق فقط (يطبع الإحصاء والعيّنات بلا قاعدة بيانات)
// مصدر الموقع: ../hadith-college-vercel-ready (أو متغيّر SITE_DIR)
// ==========================================================================
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";
import * as data from "./seed-data.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DRY = process.argv.includes("--dry");
const SITE =
  process.env.SITE_DIR ||
  path.resolve(__dirname, "..", "..", "hadith-college-vercel-ready");

function read(file) {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return null;
  }
}

// قائمة الصفحات = كل ملفات html في جذر الموقع
function pageSlugs() {
  return fs
    .readdirSync(SITE)
    .filter((f) => f.endsWith(".html"))
    .map((f) => f.replace(/\.html$/, ""))
    .sort();
}

function extract(html) {
  if (!html) return null;
  const $ = cheerio.load(html);
  const title = ($("title").first().text() || "").trim();
  const metaDesc = ($('meta[name="description"]').attr("content") || "").trim();
  const heroKicker = ($(".page-kicker").first().text() || "").trim() || null;
  const heroTitle = ($(".page-title").first().text() || "").trim() || null;
  const heroIntro = ($(".page-intro").first().text() || "").trim() || null;
  const heroImage = $(".page-hero .hero-bg").attr("src") || null;
  let body = $("#main").html();
  if (!body) {
    const portal = $(".portal-shell");
    body = portal.length ? $.html(portal) : null;
  }
  return { title, metaDesc, heroKicker, heroTitle, heroIntro, heroImage, body };
}

function parsePage(slug) {
  const ar = extract(read(path.join(SITE, `${slug}.html`)));
  const en = extract(read(path.join(SITE, "en", `${slug}.html`)));
  const template =
    slug === "index" ? "home" : slug === "student-login" ? "portal" : "inner";
  return {
    slug,
    template,
    titleAr: ar?.title || slug,
    titleEn: en?.title || ar?.title || slug,
    metaDescAr: ar?.metaDesc || null,
    metaDescEn: en?.metaDesc || null,
    heroKickerAr: ar?.heroKicker || null,
    heroKickerEn: en?.heroKicker || null,
    heroTitleAr: ar?.heroTitle || null,
    heroTitleEn: en?.heroTitle || null,
    heroIntroAr: ar?.heroIntro || null,
    heroIntroEn: en?.heroIntro || null,
    heroImage: ar?.heroImage || null,
    bodyHtmlAr: ar?.body || null,
    bodyHtmlEn: en?.body || null,
    _hasAr: !!ar,
    _hasEn: !!en,
  };
}

async function run() {
  console.log(`مصدر الموقع: ${SITE}`);
  if (!fs.existsSync(SITE)) {
    console.error("✗ لم يُعثر على مجلد الموقع. حدّد SITE_DIR.");
    process.exit(1);
  }

  const slugs = pageSlugs();
  const pages = slugs.map(parsePage);
  const withEn = pages.filter((p) => p._hasEn).length;

  // ملخّص
  const summary = {
    pages: pages.length,
    pagesWithEn: withEn,
    settings: data.settings.length,
    socialLinks: data.socialLinks.length,
    heroSlides: data.heroSlides.length,
    headerNav: data.headerNav.length,
    footerNav: data.footerNav.length,
    scholars: data.scholars.length,
    stages: data.stages.length,
    courses: data.stages.reduce((n, s) => n + (s.items?.ar?.length || 0), 0),
    newsItems: data.newsItems.length,
    events: data.events.length,
    diwanCategories: data.diwanCategories.length,
    diwanThreads: data.diwanThreads.length,
    journalIssues: data.journalIssues.length,
    papers: data.papers.length,
    libraryResources: data.libraryResources.length,
  };
  console.log("\n=== ملخّص الترحيل ===");
  for (const [k, v] of Object.entries(summary)) console.log(`  ${k}: ${v}`);

  if (DRY) {
    console.log("\n=== عيّنة صفحة (about) ===");
    const about = pages.find((p) => p.slug === "about");
    if (about)
      console.log({
        slug: about.slug,
        titleAr: about.titleAr,
        titleEn: about.titleEn,
        heroTitleAr: about.heroTitleAr,
        heroTitleEn: about.heroTitleEn,
        bodyArLen: about.bodyHtmlAr?.length ?? 0,
        bodyEnLen: about.bodyHtmlEn?.length ?? 0,
      });
    const noEn = pages.filter((p) => !p._hasEn).map((p) => p.slug);
    const noBody = pages.filter((p) => !p.bodyHtmlAr).map((p) => p.slug);
    console.log("\nصفحات بلا مقابل إنجليزي:", noEn.length ? noEn.join(", ") : "لا شيء");
    console.log("صفحات بلا محتوى body مستخرَج:", noBody.length ? noBody.join(", ") : "لا شيء");
    console.log("\n✓ وضع التحقّق (dry) — لم تُكتب بيانات. جاهز للترحيل الفعلي عند توفّر قاعدة البيانات.");
    return;
  }

  // ---- ترحيل فعلي ----
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  console.log("\nمسح جداول المحتوى وإعادة التعبئة…");
  await prisma.$transaction([
    prisma.diwanThread.deleteMany(),
    prisma.diwanCategory.deleteMany(),
    prisma.course.deleteMany(),
    prisma.programStage.deleteMany(),
    prisma.newsItem.deleteMany(),
    prisma.event.deleteMany(),
    prisma.paper.deleteMany(),
    prisma.journalIssue.deleteMany(),
    prisma.libraryResource.deleteMany(),
    prisma.scholar.deleteMany(),
    prisma.navLink.deleteMany(),
    prisma.socialLink.deleteMany(),
    prisma.heroSlide.deleteMany(),
    prisma.page.deleteMany(),
    prisma.setting.deleteMany(),
  ]);

  // الإعدادات
  for (const s of data.settings)
    await prisma.setting.create({ data: { key: s.key, group: s.group, value: s.value } });

  // السوشيال
  await prisma.socialLink.createMany({ data: data.socialLinks });

  // شرائح الهيرو
  await prisma.heroSlide.createMany({ data: data.heroSlides });

  // تنقّل الهيدر (آباء ثم أبناء)
  let ord = 0;
  for (const item of data.headerNav) {
    const parent = await prisma.navLink.create({
      data: {
        menu: "HEADER",
        labelAr: item.labelAr,
        labelEn: item.labelEn,
        href: item.href,
        icon: item.icon || null,
        order: ord++,
      },
    });
    if (item.children) {
      let co = 0;
      for (const c of item.children)
        await prisma.navLink.create({
          data: {
            menu: "HEADER",
            labelAr: c.labelAr,
            labelEn: c.labelEn,
            href: c.href,
            parentId: parent.id,
            order: co++,
          },
        });
    }
  }
  // تنقّل الفوتر
  let fo = 0;
  for (const f of data.footerNav)
    await prisma.navLink.create({
      data: {
        menu: "FOOTER",
        labelAr: f.labelAr,
        labelEn: f.labelEn,
        href: f.href || "#",
        group: f.group,
        order: fo++,
      },
    });

  // الهيئة العلمية
  await prisma.scholar.createMany({ data: data.scholars });

  // المراحل والمقرّرات
  for (const st of data.stages) {
    const stage = await prisma.programStage.create({
      data: {
        key: st.key, numAr: st.numAr, numEn: st.numEn, titleAr: st.titleAr, titleEn: st.titleEn,
        metaAr: st.metaAr, metaEn: st.metaEn, descAr: st.descAr, descEn: st.descEn,
        items: st.items, icon: st.icon, moreHref: st.moreHref, order: st.order,
      },
    });
    const ar = st.items?.ar || [];
    const en = st.items?.en || [];
    for (let i = 0; i < ar.length; i++)
      await prisma.course.create({
        data: { titleAr: ar[i], titleEn: en[i] || ar[i], stageId: stage.id, order: i },
      });
  }

  // الأخبار والفعاليات
  await prisma.newsItem.createMany({
    data: data.newsItems.map((n) => ({ ...n, date: new Date(n.date) })),
  });
  await prisma.event.createMany({
    data: data.events.map((e) => ({ ...e, date: new Date(e.date) })),
  });

  // الديوان
  const catMap = {};
  for (const c of data.diwanCategories) {
    const cat = await prisma.diwanCategory.create({ data: c });
    catMap[c.key] = cat.id;
  }
  for (const t of data.diwanThreads) {
    const { categoryKey, ...rest } = t;
    await prisma.diwanThread.create({
      data: { ...rest, categoryId: catMap[categoryKey] || null },
    });
  }

  // المجلة والأبحاث
  await prisma.journalIssue.createMany({ data: data.journalIssues });
  await prisma.paper.createMany({ data: data.papers });

  // المكتبة
  await prisma.libraryResource.createMany({ data: data.libraryResources });

  // الصفحات
  for (const p of pages) {
    const { _hasAr, _hasEn, ...pd } = p;
    await prisma.page.create({ data: pd });
  }

  const counts = {
    pages: await prisma.page.count(),
    scholars: await prisma.scholar.count(),
    news: await prisma.newsItem.count(),
    diwan: await prisma.diwanThread.count(),
    nav: await prisma.navLink.count(),
    library: await prisma.libraryResource.count(),
  };
  console.log("\n✓ اكتمل الترحيل:", counts);
  await prisma.$disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
