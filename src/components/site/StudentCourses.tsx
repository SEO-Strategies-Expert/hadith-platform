/**
 * قسما «مقرّراتي» و«مجالسي القادمة» في لوحة الطالب.
 *
 * فُصلا عن اللوحة لأنّ كلًّا منهما استعلامٌ مستقلّ من `lib/lms.ts`، ولأنّ
 * صفحة المقرّر تعيد استعمال بطاقة المقرّر نفسها لاحقًا.
 */
import Link from "next/link";
import type { Lang } from "@/lib/site-data";
import { longDate } from "@/lib/site-format";
import { siteHref } from "@/lib/site-links";
import { getStudentCourses, getUpcomingSessions, isLiveNow, title, timeLabel } from "@/lib/lms";
import { Pill, num } from "@/components/site/StudentPortalKit";
import { StudentCourseGrid } from "@/components/site/StudentCourseGrid";

const T = {
  ar: {
    myCourses: "مقرّراتي",
    myCoursesLede: "المقرّرات المسجَّل فيها وتقدّمك في كلٍّ منها.",
    emptyTitle: "لم تُسجَّل في أي مقرّر بعد",
    emptyBody:
      "بمجرّد اعتماد التحاقك بأحد البرامج ستظهر مقرّراتك هنا مع دروسها ومجالسها. يمكنك في الأثناء تصفّح البرامج الدراسيّة أو تقديم طلب التحاق.",
    browsePrograms: "البرامج الدراسيّة",
    apply: "طلب الالتحاق",
    resume: "تابع الدراسة",
    progress: "نسبة الإنجاز",
    instructor: "المحاضر",
    stage: "المرحلة",
    pending: "قيد الاعتماد",
    completed: "مُنجَز",
    cancelled: "ملغى",
    sessions: "مجالسي القادمة",
    noSessions: "لا مجالس مجدولة لك حاليًّا.",
    join: "انضم الآن",
    liveNow: "مباشر الآن",
    upcoming: "قادم",
    recording: "شاهد التسجيل",
    ended: "انتهى",
    generalSession: "مجلس عامّ",
    minutes: "دقيقة",
    search: "ابحث في المقررات أو المحاضرين", status: "الحالة", all: "الكل", active: "نشط", allStages: "كل المراحل", noResults: "لا توجد مقررات مطابقة", pagination: "صفحات المقررات",
  },
  en: {
    myCourses: "My courses",
    myCoursesLede: "The courses you are enrolled in and your progress in each.",
    emptyTitle: "You are not enrolled in any course yet",
    emptyBody:
      "Once your admission to a programme is approved, your courses will appear here with their lessons and live sessions. In the meantime, browse the programmes or submit an application.",
    browsePrograms: "Programmes",
    apply: "Apply for admission",
    resume: "Continue studying",
    progress: "Completion",
    instructor: "Instructor",
    stage: "Stage",
    pending: "Pending approval",
    completed: "Completed",
    cancelled: "Cancelled",
    sessions: "My upcoming sessions",
    noSessions: "No sessions are scheduled for you at the moment.",
    join: "Join now",
    liveNow: "Live now",
    upcoming: "Upcoming",
    recording: "Watch recording",
    ended: "Ended",
    generalSession: "General session",
    minutes: "min",
    search: "Search courses or instructors", status: "Status", all: "All", active: "Active", allStages: "All stages", noResults: "No matching courses", pagination: "Course pages",
  },
} as const;

/** نهاية المجلس الفعليّة — نفس منطق `isLiveNow` لكن للسؤال «هل انتهى؟». */
function sessionEnd(s: { startsAt: Date; endsAt: Date | null; durationMin: number }): number {
  return (s.endsAt ?? new Date(s.startsAt.getTime() + s.durationMin * 60_000)).getTime();
}

// ---------------------------------------------------------------------------

export async function StudentCourses({ lang, userId }: { lang: Lang; userId: string }) {
  const t = T[lang];
  const enrollments = await getStudentCourses(userId);

  return (
    <section className="inner-section cream orn-cream" id="my-courses">
      <div className="container">
        <header className="section-cap reveal">
          <h2 className="thuluth">{t.myCourses}</h2>
          <p>{t.myCoursesLede}</p>
        </header>

        {enrollments.length === 0 ? (
          // حالة فارغة توجّه الطالب بدل شبكة خالية
          <div className="callout reveal">
            <h3>{t.emptyTitle}</h3>
            <p>{t.emptyBody}</p>
            <div className="page-actions" style={{ marginTop: 20 }}>
              <Link className="btn btn-gold" href={siteHref(lang, "programs.html")}>
                {t.browsePrograms}
              </Link>
              <Link className="btn btn-outline-ink" href={siteHref(lang, "admissions.html")}>
                {t.apply}
              </Link>
            </div>
          </div>
        ) : (
          <StudentCourseGrid lang={lang} enrollments={enrollments} labels={{...t}} />
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------

export async function StudentSessions({ lang, userId }: { lang: Lang; userId: string }) {
  const t = T[lang];
  const sessions = await getUpcomingSessions(userId);
  const now = Date.now();

  return (
    <section className="inner-section white orn-cream student-sessions-section" id="my-sessions">
      <div className="container">
        <header className="section-cap reveal">
          <h2 className="thuluth">{t.sessions}</h2>
        </header>

        {sessions.length === 0 ? (
          <p>{t.noSessions}</p>
        ) : (
          <div className="card-grid">
            {sessions.map((s) => {
              const live = isLiveNow(s);
              const ended = now > sessionEnd(s);
              return (
                <article className="info-card reveal" key={s.id}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                    {live ? (
                      <Pill>{t.liveNow}</Pill>
                    ) : ended ? (
                      <Pill tone="muted">{t.ended}</Pill>
                    ) : (
                      <Pill tone="navy">{t.upcoming}</Pill>
                    )}
                    {s.durationMin > 0 && (
                      <Pill tone="muted">
                        {num(s.durationMin, lang)} {t.minutes}
                      </Pill>
                    )}
                  </div>

                  <h3>{title(lang, s.titleAr, s.titleEn)}</h3>
                  <p style={{ margin: "0 0 4px", fontWeight: 700 }}>
                    {s.course
                      ? title(lang, s.course.titleAr, s.course.titleEn)
                      : t.generalSession}
                  </p>
                  {s.instructor && (
                    <p style={{ margin: "0 0 4px" }}>
                      {t.instructor}: {title(lang, s.instructor.nameAr, s.instructor.nameEn)}
                    </p>
                  )}
                  <p style={{ margin: 0, fontWeight: 800 }}>
                    {longDate(s.startsAt, lang, { arabicDigits: lang === "ar" })} —{" "}
                    {timeLabel(s.startsAt, lang)}
                  </p>

                  <div className="page-actions" style={{ marginTop: 18 }}>
                    {/* «انضم الآن» يظهر في نافذة البثّ فقط، ولا يُعرض رابط مضيف قطّ */}
                    {live && s.joinUrl && (
                      <a
                        className="btn btn-gold"
                        href={s.joinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t.join}
                      </a>
                    )}
                    {ended && s.recordingUrl && (
                      <a
                        className="btn btn-outline-ink"
                        href={s.recordingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t.recording}
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
