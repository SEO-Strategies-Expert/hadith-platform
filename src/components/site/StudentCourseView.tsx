/**
 * صفحة المقرّر داخل بوابة الطالب: شجرة الوحدات والدروس مع علامات الإنجاز.
 *
 * التحقّق من الصلاحيّة يقع هنا لا في الصفحة الموجِّهة، لأنّ `src/proxy.ts`
 * يحمي `/student` و`/en/student` وحدهما ولا يغطّي المسارات الفرعيّة.
 */
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Lang } from "@/lib/site-data";
import { currentUser } from "@/lib/guard";
import {
  getCourseTree,
  getProgressMap,
  flattenLessons,
  isEnrolled,
  title,
} from "@/lib/lms";
import { StudentQuizAssignmentLinks } from "@/components/site/StudentQuizAssignmentLinks";
import { ProgressBar, Pill, studentHref, num, clampPct } from "@/components/site/StudentPortalKit";

const T = {
  ar: {
    kicker: "مقرّر دراسيّ",
    back: "لوحة الطالب",
    instructor: "المحاضر",
    stage: "المرحلة",
    progress: "نسبة الإنجاز",
    lessons: "الدروس",
    lesson: "درس",
    lessonsCount: "عدد الدروس",
    done: "أُنجز",
    notDone: "لم يُنجَز",
    minutes: "دقيقة",
    emptyModules: "لم تُضَف وحدات دراسيّة لهذا المقرّر بعد.",
    emptyLessons: "لا دروس في هذه الوحدة بعد.",
    start: "ابدأ من أوّل درس",
    preview: "معاينة مجّانيّة",
    kinds: {
      VIDEO: "مرئي",
      PDF: "ملفّ",
      TEXT: "متن",
      LIVE: "مجلس مباشر",
      QUIZ: "اختبار",
    } as Record<string, string>,
  },
  en: {
    kicker: "Course",
    back: "Student dashboard",
    instructor: "Instructor",
    stage: "Stage",
    progress: "Completion",
    lessons: "Lessons",
    lesson: "Lesson",
    lessonsCount: "Lessons",
    done: "Completed",
    notDone: "Not completed",
    minutes: "min",
    emptyModules: "No modules have been added to this course yet.",
    emptyLessons: "No lessons in this module yet.",
    start: "Start with the first lesson",
    preview: "Free preview",
    kinds: {
      VIDEO: "Video",
      PDF: "File",
      TEXT: "Text",
      LIVE: "Live session",
      QUIZ: "Quiz",
    } as Record<string, string>,
  },
} as const;

export async function StudentCourseView({ lang, courseId }: { lang: Lang; courseId: string }) {
  const user = await currentUser();
  if (!user?.id) redirect(lang === "en" ? "/en/student-login.html" : "/student-login.html");

  // لا يُكشف وجود المقرّر لغير المسجَّل — نفس الجواب في الحالتين.
  const [enrolled, course] = await Promise.all([
    isEnrolled(user.id, courseId),
    getCourseTree(courseId),
  ]);
  if (!enrolled || !course || !course.visible) notFound();

  const t = T[lang];
  const lessons = flattenLessons(course);
  const progress = await getProgressMap(user.id, lessons.map((l) => l.id));
  const doneCount = lessons.filter((l) => progress.get(l.id)).length;
  const pct = lessons.length ? clampPct((doneCount / lessons.length) * 100) : 0;

  // «ابدأ/تابع» يقفز إلى أوّل درس غير منجَز، وإلّا فأوّل درس.
  const nextLesson = lessons.find((l) => !progress.get(l.id)) ?? lessons[0];

  return (
    <main id="main">
      <section className="page-hero orn-navy">
        <div className="container">
          <div className="page-hero-copy reveal">
            <p className="page-kicker">{t.kicker}</p>
            <h1 className="page-title thuluth gold-text">
              {title(lang, course.titleAr, course.titleEn)}
            </h1>
            <div className="page-meta">
              {course.stage && (
                <span>
                  {t.stage}: {title(lang, course.stage.titleAr, course.stage.titleEn)}
                </span>
              )}
              {course.instructor && (
                <span>
                  {t.instructor}: {title(lang, course.instructor.nameAr, course.instructor.nameEn)}
                </span>
              )}
              <span>
                {t.lessonsCount}: {num(lessons.length, lang)}
              </span>
            </div>
            <div className="page-actions" style={{ marginTop: 22 }}>
              {nextLesson && (
                <Link className="btn btn-gold" href={studentHref(lang, `/lesson/${nextLesson.id}`)}>
                  {t.start}
                </Link>
              )}
              <Link className="btn btn-outline-ink" href={studentHref(lang)}>
                {t.back}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="inner-section white orn-cream">
        <div className="container">
          <div className="callout reveal">
            <h3>{t.progress}</h3>
            <p>
              {num(doneCount, lang)} / {num(lessons.length, lang)} {t.lessons}
            </p>
            <ProgressBar pct={pct} lang={lang} label={t.progress} />
          </div>
        </div>
      </section>

      <section className="inner-section cream orn-cream">
        <div className="container">
          <header className="section-cap reveal">
            <h2 className="thuluth">{t.lessons}</h2>
          </header>

          {course.modules.length === 0 ? (
            <p>{t.emptyModules}</p>
          ) : (
            <div style={{ display: "grid", gap: 22 }}>
              {course.modules.map((m, mi) => (
                <article className="info-card reveal" key={m.id}>
                  <div className="num">{num(mi + 1, lang)}</div>
                  <h3>{title(lang, m.titleAr, m.titleEn)}</h3>
                  {title(lang, m.descAr, m.descEn) && <p>{title(lang, m.descAr, m.descEn)}</p>}

                  {m.lessons.length === 0 ? (
                    <p style={{ marginTop: 12 }}>{t.emptyLessons}</p>
                  ) : (
                    <ul style={{ listStyle: "none", margin: "16px 0 0", padding: 0, display: "grid", gap: 10 }}>
                      {m.lessons.map((l, li) => {
                        const isDone = progress.get(l.id) === true;
                        return (
                          <li key={l.id}>
                            <Link
                              href={studentHref(lang, `/lesson/${l.id}`)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                flexWrap: "wrap",
                                padding: "12px 14px",
                                borderRadius: 12,
                                border: "1px solid rgba(18,49,89,.12)",
                                background: isDone ? "rgba(217,174,75,.10)" : "rgba(255,255,255,.7)",
                              }}
                            >
                              {/* علامة الإنجاز — رمز نصّي ليعمل بلا أيقونات ولا JS */}
                              <span
                                aria-hidden="true"
                                style={{
                                  width: 24,
                                  height: 24,
                                  flex: "0 0 24px",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  borderRadius: "50%",
                                  fontSize: 13,
                                  fontWeight: 900,
                                  color: isDone ? "#123159" : "#8f9bad",
                                  background: isDone ? "#D8AB4A" : "rgba(18,49,89,.08)",
                                  border: "1px solid rgba(18,49,89,.14)",
                                }}
                              >
                                {isDone ? "✓" : num(li + 1, lang)}
                              </span>
                              <span style={{ fontWeight: 800, color: "#123159", flex: "1 1 200px" }}>
                                {title(lang, l.titleAr, l.titleEn)}
                              </span>
                              <span style={{ display: "inline-flex", gap: 8, flexWrap: "wrap" }}>
                                <Pill tone="muted">{t.kinds[l.kind] ?? l.kind}</Pill>
                                {l.durationMin ? (
                                  <Pill tone="muted">
                                    {num(l.durationMin, lang)} {t.minutes}
                                  </Pill>
                                ) : null}
                                {l.freePreview && <Pill>{t.preview}</Pill>}
                              </span>
                              <span className="sr-only">{isDone ? t.done : t.notDone}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
          <StudentQuizAssignmentLinks lang={lang} courseId={courseId} />
</main>
  );
}
