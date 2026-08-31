import Link from "next/link";
import { notFound } from "next/navigation";
import type { Lang } from "@/lib/site-data";
import { currentUser } from "@/lib/guard";
import { flattenLessons, getCourseTree, isEnrolled, title } from "@/lib/lms";
import { num, studentHref } from "@/components/site/StudentPortalKit";
import { siteHref } from "@/lib/site-links";

const T = {
  ar: { kicker:"دورة علمية", instructor:"المحاضر", about:"عن هذه الدورة", curriculum:"محتوى الدورة", sections:"أقسام", lessons:"دروس", min:"دقيقة", hours:"ساعة", empty:"لم يُضف محتوى لهذه الدورة بعد.", enrolled:"الدخول إلى المقرر", apply:"طلب الالتحاق", login:"دخول الطالب", kinds:{VIDEO:"فيديو",PDF:"ملف",TEXT:"قراءة",LIVE:"مباشر",QUIZ:"اختبار"} as Record<string,string> },
  en: { kicker:"Academic course", instructor:"Instructor", about:"About this course", curriculum:"Course content", sections:"sections", lessons:"lessons", min:"min", hours:"hours", empty:"No course content has been added yet.", enrolled:"Open course", apply:"Apply for admission", login:"Student login", kinds:{VIDEO:"Video",PDF:"File",TEXT:"Reading",LIVE:"Live",QUIZ:"Quiz"} as Record<string,string> },
} as const;

export async function PublicCourseView({ lang, courseId }: { lang: Lang; courseId: string }) {
  const course = await getCourseTree(courseId);
  if (!course?.visible) notFound();
  const viewer = await currentUser();
  const enrolled = viewer?.id ? await isEnrolled(viewer.id, courseId) : false;
  const lessons = flattenLessons(course);
  const duration = lessons.reduce((sum, lesson) => sum + (lesson.durationMin ?? 0), 0);
  const t = T[lang];
  const description = title(lang, course.descAr, course.descEn) || title(lang, course.summaryAr, course.summaryEn);
  const admissionHref = `${siteHref(lang,"admissions.html")}?courseId=${encodeURIComponent(course.id)}`;

  return <main id="main" className="learning-page">
    <section className="learning-hero"><div className="container learning-hero-grid">
      <div className="learning-hero-copy"><div className="learning-kicker">{t.kicker}</div><h1>{title(lang,course.titleAr,course.titleEn)}</h1>{description && <p>{description}</p>}<div className="learning-meta">
        {course.instructor && <span>{t.instructor} <b>{title(lang,course.instructor.nameAr,course.instructor.nameEn)}</b></span>}{course.stage && <span>{title(lang,course.stage.titleAr,course.stage.titleEn)}</span>}{course.hours && <span>{num(course.hours,lang)} {t.hours}</span>}
      </div></div>
      <aside className="learning-side-card"><div className="learning-cover" style={course.imageUrl ? {backgroundImage:`linear-gradient(rgba(7,22,48,.12),rgba(7,22,48,.65)),url(${course.imageUrl})`} : undefined}><span>▶</span></div><div className="learning-side-body">
        {enrolled ? <Link className="learning-primary" href={studentHref(lang,`/course/${course.id}`)}>{t.enrolled}</Link> : <><Link className="learning-primary" href={admissionHref}>{t.apply}</Link>{!viewer && <Link className="learning-secondary" href={siteHref(lang,"student-login.html")}>{t.login}</Link>}</>}
      </div></aside>
    </div></section>
    <section className="learning-body"><div className="container learning-layout"><div className="learning-main">
      {description && <section className="learning-about"><h2>{t.about}</h2><p>{description}</p></section>}
      <div className="learning-curriculum-head"><h2>{t.curriculum}</h2><span>{num(course.modules.length,lang)} {t.sections} · {num(lessons.length,lang)} {t.lessons}{duration ? ` · ${num(duration,lang)} ${t.min}` : ""}</span></div>
      {!course.modules.length ? <div className="learning-empty">{t.empty}</div> : <div className="learning-curriculum">{course.modules.map((module,index) => <details key={module.id} open={index===0}>
        <summary><span><b>{title(lang,module.titleAr,module.titleEn)}</b><small>{num(module.lessons.length,lang)} {t.lessons}</small></span><i>⌄</i></summary>
        <div className="learning-lessons">{module.lessons.map((lesson,lessonIndex) => <div className="public-lesson-row" key={lesson.id}><span className="lesson-check">○</span><span className="lesson-title"><b>{num(lessonIndex+1,lang)}. {title(lang,lesson.titleAr,lesson.titleEn)}</b><small>{t.kinds[lesson.kind] ?? lesson.kind}</small></span><span className="lesson-duration">{lesson.durationMin ? `${num(lesson.durationMin,lang)} ${t.min}` : "🔒"}</span></div>)}</div>
      </details>)}</div>}
    </div></div></section>
  </main>;
}
