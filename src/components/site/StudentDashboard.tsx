import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/guard";
import type { Lang } from "@/lib/site-data";
import { longDate, mediaUrl } from "@/lib/site-format";
import { siteHref } from "@/lib/site-links";
import { studentLogout } from "@/app/(site)/student-actions";

const T = {
  ar: {
    kicker: "بوابة الطالب",
    welcome: "مرحبًا",
    logout: "تسجيل الخروج",
    profile: "بياناتي",
    email: "البريد الإلكتروني",
    studentNo: "الرقم الجامعي",
    program: "البرنامج",
    country: "الدولة",
    phone: "رقم الهاتف",
    none: "—",
    application: "حالة طلب الالتحاق",
    noApplication: "لا يوجد طلب التحاق مرتبط ببريدك.",
    submitted: "أُرسل في",
    courses: "المقرّرات المتاحة",
    noCourses: "لم تُضَف مقرّرات بعد.",
    events: "الفعاليات القادمة",
    noEvents: "لا فعاليات مجدولة حاليًّا.",
    news: "آخر الأخبار",
    library: "المكتبة الرقمية",
    diwan: "ديوان العلماء",
    contact: "تواصل مع الكلّية",
    quick: "روابط سريعة",
    statuses: {
      NEW: "قيد الاستلام",
      IN_PROGRESS: "قيد المراجعة",
      DONE: "مقبول ومكتمل",
      ARCHIVED: "مؤرشف",
    } as Record<string, string>,
  },
  en: {
    kicker: "Student portal",
    welcome: "Welcome",
    logout: "Sign out",
    profile: "My details",
    email: "Email address",
    studentNo: "Student number",
    program: "Programme",
    country: "Country",
    phone: "Phone",
    none: "—",
    application: "Application status",
    noApplication: "No application is linked to your email.",
    submitted: "Submitted on",
    courses: "Available courses",
    noCourses: "No courses added yet.",
    events: "Upcoming events",
    noEvents: "No scheduled events at the moment.",
    news: "Latest news",
    library: "Digital library",
    diwan: "Scholars' forum",
    contact: "Contact the college",
    quick: "Quick links",
    statuses: {
      NEW: "Received",
      IN_PROGRESS: "Under review",
      DONE: "Accepted",
      ARCHIVED: "Archived",
    } as Record<string, string>,
  },
} as const;

export async function StudentDashboard({ lang }: { lang: Lang }) {
  const user = await currentUser();
  if (!user) redirect(lang === "en" ? "/en/student-login.html" : "/student-login.html");

  const t = T[lang];
  const [profile, application, courses, events, news] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.id as string } }),
    user.email
      ? prisma.admissionApplication.findFirst({
          where: { email: user.email },
          orderBy: { createdAt: "desc" },
        })
      : null,
    prisma.course.findMany({ where: { visible: true }, orderBy: { order: "asc" }, take: 12 }),
    prisma.event.findMany({ where: { visible: true }, orderBy: { date: "asc" }, take: 4 }),
    prisma.newsItem.findMany({ where: { visible: true }, orderBy: { date: "desc" }, take: 3 }),
  ]);

  const row = (label: string, value: string | null | undefined) => (
    <div className="page-meta" style={{ margin: 0 }}>
      <span style={{ fontWeight: 800 }}>{label}</span>
      <span>{value || t.none}</span>
    </div>
  );

  return (
    <main id="main">
      <section className="page-hero orn-navy">
        <div className="container">
          <div className="page-hero-copy reveal">
            <p className="page-kicker">{t.kicker}</p>
            <h1 className="page-title thuluth gold-text">
              {t.welcome} {profile?.name ?? ""}
            </h1>
            <div className="page-actions">
              <form action={studentLogout.bind(null, lang)}>
                <button className="btn btn-outline" type="submit">
                  {t.logout}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <section className="inner-section white orn-cream">
        <div className="container">
          <div className="content-split">
            <div className="split-copy reveal">
              <h2 className="thuluth">{t.profile}</h2>
              <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
                {row(t.email, profile?.email)}
                {row(t.studentNo, profile?.studentNo)}
                {row(t.program, profile?.program)}
                {row(t.country, profile?.country)}
                {row(t.phone, profile?.phone)}
              </div>
            </div>

            <div className="callout reveal">
              <h3>{t.application}</h3>
              {application ? (
                <>
                  <p style={{ fontWeight: 800 }}>
                    {t.statuses[application.status] ?? application.status}
                  </p>
                  <p>
                    {application.program ?? ""} — {t.submitted}{" "}
                    {longDate(application.createdAt, lang)}
                  </p>
                </>
              ) : (
                <p>{t.noApplication}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="inner-section cream orn-cream">
        <div className="container">
          <header className="section-cap reveal">
            <h2 className="thuluth">{t.courses}</h2>
          </header>
          {courses.length === 0 ? (
            <p>{t.noCourses}</p>
          ) : (
            <div className="card-grid ">
              {courses.map((c) => (
                <article className="info-card reveal" key={c.id}>
                  <h3>{lang === "ar" ? c.titleAr : c.titleEn}</h3>
                  {(lang === "ar" ? c.descAr : c.descEn) && (
                    <p>{lang === "ar" ? c.descAr : c.descEn}</p>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="inner-section white orn-cream">
        <div className="container">
          <header className="section-cap reveal">
            <h2 className="thuluth">{t.events}</h2>
          </header>
          {events.length === 0 ? (
            <p>{t.noEvents}</p>
          ) : (
            <ul className="agenda-list">
              {events.map((e) => (
                <li key={e.id}>
                  <div>
                    <b>{lang === "ar" ? e.titleAr : e.titleEn}</b>
                    <span>{longDate(e.date, lang)}</span>
                    {(lang === "ar" ? e.whenAr : e.whenEn) && (
                      <span className="when">{lang === "ar" ? e.whenAr : e.whenEn}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="inner-section cream orn-cream">
        <div className="container">
          <header className="section-cap reveal">
            <h2 className="thuluth">{t.news}</h2>
          </header>
          <div className="card-grid ">
            {news.map((n) => (
              <article className="image-card reveal" key={n.id}>
                <Link href={`${siteHref(lang, "news-detail.html")}?item=${n.slug ?? n.id}`}>
                  <div className="thumb">
                    <img
                      src={mediaUrl(n.imageUrl, "/assets/img/news-1.jpg")}
                      alt=""
                      width={800}
                      height={500}
                      loading="lazy"
                    />
                  </div>
                  <div className="body">
                    <h3>{lang === "ar" ? n.titleAr : n.titleEn}</h3>
                    <div className="card-foot">
                      <span>{longDate(n.date, lang)}</span>
                      <strong>{lang === "ar" ? "←" : "→"}</strong>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>

          <div className="page-actions" style={{ marginTop: 24 }}>
            <Link className="btn btn-gold" href={siteHref(lang, "library.html")}>
              {t.library}
            </Link>
            <Link className="btn btn-outline-ink" href={siteHref(lang, "diwan.html")}>
              {t.diwan}
            </Link>
            <Link className="btn btn-outline-ink" href={siteHref(lang, "contact.html")}>
              {t.contact}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
