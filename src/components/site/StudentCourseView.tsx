import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Lang } from "@/lib/site-data";
import { currentUser } from "@/lib/guard";
import { getCourseTree, getProgressMap, flattenLessons, isEnrolled, title } from "@/lib/lms";
import { StudentQuizAssignmentLinks } from "@/components/site/StudentQuizAssignmentLinks";
import { studentHref, num, clampPct } from "@/components/site/StudentPortalKit";

const T = {
  ar: { course:"مقرر دراسي", back:"العودة إلى مقرراتي", instructor:"يقدمه", progress:"تقدمك", complete:"مكتمل", curriculum:"محتوى المقرر", sections:"أقسام", lessons:"دروس", continue:"متابعة التعلم", start:"ابدأ التعلم", preview:"معاينة", empty:"لم يُضف محتوى لهذا المقرر بعد.", min:"د", about:"عن هذا المقرر", kinds:{VIDEO:"فيديو",PDF:"ملف",TEXT:"قراءة",LIVE:"مباشر",QUIZ:"اختبار"} as Record<string,string> },
  en: { course:"Course", back:"Back to my courses", instructor:"Created by", progress:"Your progress", complete:"complete", curriculum:"Course content", sections:"sections", lessons:"lectures", continue:"Continue learning", start:"Start course", preview:"Preview", empty:"No course content has been added yet.", min:"min", about:"About this course", kinds:{VIDEO:"Video",PDF:"File",TEXT:"Reading",LIVE:"Live",QUIZ:"Quiz"} as Record<string,string> },
} as const;

export async function StudentCourseView({ lang, courseId }: { lang: Lang; courseId: string }) {
  const user = await currentUser();
  if (!user?.id) redirect(lang === "en" ? "/en/student-login.html" : "/student-login.html");
  const [enrolled, course] = await Promise.all([isEnrolled(user.id, courseId), getCourseTree(courseId)]);
  if (!enrolled || !course || !course.visible) notFound();
  const t = T[lang];
  const lessons = flattenLessons(course);
  const progress = await getProgressMap(user.id, lessons.map(l => l.id));
  const doneCount = lessons.filter(l => progress.get(l.id)).length;
  const pct = lessons.length ? clampPct((doneCount / lessons.length) * 100) : 0;
  const nextLesson = lessons.find(l => !progress.get(l.id)) ?? lessons[0];
  const duration = lessons.reduce((sum, lesson) => sum + (lesson.durationMin ?? 0), 0);

  return <main id="main" className="learning-page">
    <header className="learning-topbar"><Link href={studentHref(lang)}>← {t.back}</Link><span>{title(lang, course.titleAr, course.titleEn)}</span></header>
    <section className="learning-hero">
      <div className="container learning-hero-grid">
        <div className="learning-hero-copy">
          <div className="learning-kicker">{t.course}</div>
          <h1>{title(lang, course.titleAr, course.titleEn)}</h1>
          {(title(lang, course.summaryAr, course.summaryEn) || title(lang, course.descAr, course.descEn)) && <p>{title(lang, course.summaryAr, course.summaryEn) || title(lang, course.descAr, course.descEn)}</p>}
          <div className="learning-meta">
            {course.instructor && <span>{t.instructor} <b>{title(lang, course.instructor.nameAr, course.instructor.nameEn)}</b></span>}
            {course.stage && <span>{title(lang, course.stage.titleAr, course.stage.titleEn)}</span>}
          </div>
        </div>
        <aside className="learning-side-card">
          <div className="learning-cover" style={course.imageUrl ? {backgroundImage:`linear-gradient(rgba(7,22,48,.12),rgba(7,22,48,.65)),url(${course.imageUrl})`} : undefined}><span>▶</span></div>
          <div className="learning-side-body">
            <div className="learning-progress-label"><b>{t.progress}</b><strong>{num(pct,lang)}%</strong></div>
            <div className="learning-progress"><i style={{width:`${pct}%`}} /></div>
            <small>{num(doneCount,lang)} / {num(lessons.length,lang)} {t.lessons} · {t.complete}</small>
            {nextLesson && <Link className="learning-primary" href={studentHref(lang, `/lesson/${nextLesson.id}`)}>{doneCount ? t.continue : t.start}</Link>}
          </div>
        </aside>
      </div>
    </section>
    <section className="learning-body"><div className="container learning-layout"><div className="learning-main">
      {(title(lang, course.descAr, course.descEn) || title(lang, course.summaryAr, course.summaryEn)) && <section className="learning-about"><h2>{t.about}</h2><p>{title(lang, course.descAr, course.descEn) || title(lang, course.summaryAr, course.summaryEn)}</p></section>}
      <div className="learning-curriculum-head"><h2>{t.curriculum}</h2><span>{num(course.modules.length,lang)} {t.sections} · {num(lessons.length,lang)} {t.lessons}{duration ? ` · ${num(duration,lang)} ${t.min}` : ""}</span></div>
      {!course.modules.length ? <div className="learning-empty">{t.empty}</div> : <div className="learning-curriculum">
        {course.modules.map((module, mi) => { const moduleDone = module.lessons.filter(l => progress.get(l.id)).length; return <details key={module.id} open={mi === 0}>
          <summary><span><b>{title(lang,module.titleAr,module.titleEn)}</b><small>{num(moduleDone,lang)}/{num(module.lessons.length,lang)} {t.lessons}</small></span><i>⌄</i></summary>
          <div className="learning-lessons">{module.lessons.map((lesson, li) => { const done = progress.get(lesson.id) === true; return <Link key={lesson.id} href={studentHref(lang, `/lesson/${lesson.id}`)} className={done ? "is-done" : ""}>
            <span className="lesson-check">{done ? "✓" : "○"}</span><span className="lesson-title"><b>{num(li+1,lang)}. {title(lang,lesson.titleAr,lesson.titleEn)}</b><small>{t.kinds[lesson.kind] ?? lesson.kind}{lesson.freePreview ? ` · ${t.preview}` : ""}</small></span><span className="lesson-duration">{lesson.durationMin ? `${num(lesson.durationMin,lang)} ${t.min}` : "›"}</span>
          </Link>; })}</div>
        </details>; })}
      </div>}
    </div></div></section>
    <StudentQuizAssignmentLinks lang={lang} courseId={courseId} />
  </main>;
}
