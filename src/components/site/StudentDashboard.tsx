import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/guard";
import type { Lang } from "@/lib/site-data";
import { longDate, mediaUrl } from "@/lib/site-format";
import { siteHref } from "@/lib/site-links";
import { studentLogout } from "@/app/(site)/student-actions";
import { StudentCourses, StudentSessions } from "@/components/site/StudentCourses";
import { StudentCertificates } from "@/components/site/StudentCertificates";
import { StudentPayments } from "@/components/site/StudentPayments";

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
    news: "آخر الأخبار",
    library: "المكتبة الرقمية",
    diwan: "ديوان العلماء",
    contact: "تواصل مع الكلّية",
    goCourses: "مقرّراتي",
    goSessions: "مجالسي",
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
    news: "Latest news",
    library: "Digital library",
    diwan: "Scholars' forum",
    contact: "Contact the college",
    goCourses: "My courses",
    goSessions: "My sessions",
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
  if (!user?.id) redirect(lang === "en" ? "/en/student-login.html" : "/student-login.html");

  const t = T[lang];
  const [profile, application, news] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.id } }),
    user.email
      ? prisma.admissionApplication.findFirst({
          where: { email: user.email },
          orderBy: { createdAt: "desc" },
        })
      : null,
    prisma.newsItem.findMany({ where: { visible: true }, orderBy: { date: "desc" }, take: 3 }),
  ]);

  // `page-meta` مصمَّم لخلفيّة كحليّة، فبيانات الطالب على خلفيّة بيضاء
  // تُصاغ بتنسيقٍ مضمَّن ليبقى النصّ مقروءًا.
  const row = (label: string, value: string | null | undefined) => (
    <div
      style={{
        display: "flex",
        gap: 12,
        flexWrap: "wrap",
        padding: "10px 0",
        borderBottom: "1px solid rgba(18,49,89,.10)",
      }}
    >
      <span style={{ fontWeight: 800, color: "#123159", minWidth: 150 }}>{label}</span>
      <span style={{ color: "#3d4a5c" }}>{value || t.none}</span>
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
              <Link className="btn btn-gold" href="#my-courses">
                {t.goCourses}
              </Link>
              <Link className="btn btn-outline-ink" href="#my-sessions">
                {t.goSessions}
              </Link>
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
              <div style={{ display: "grid", gap: 2, marginTop: 16 }}>
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
                    {longDate(application.createdAt, lang, { arabicDigits: lang === "ar" })}
                  </p>
                </>
              ) : (
                <p>{t.noApplication}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* المقرّرات والمجالس من `lib/lms.ts` — مرتبطة بالطالب لا قوائم عامّة */}
      <StudentCourses lang={lang} userId={user.id} />
      <StudentSessions lang={lang} userId={user.id} />
      <StudentCertificates lang={lang} userId={user.id} />
      <StudentPayments lang={lang} />

      <section className="inner-section cream orn-cream">
        <div className="container">
          <header className="section-cap reveal">
            <h2 className="thuluth">{t.news}</h2>
          </header>
          <div className="card-grid">
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
                      <span>{longDate(n.date, lang, { arabicDigits: lang === "ar" })}</span>
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
