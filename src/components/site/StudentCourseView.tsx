import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Lang } from "@/lib/site-data";
import { currentUser } from "@/lib/guard";
import { getCourseTree, getProgressMap, flattenLessons, isEnrolled, title } from "@/lib/lms";
import { StudentQuizAssignmentLinks } from "@/components/site/StudentQuizAssignmentLinks";
import { studentHref, num, clampPct } from "@/components/site/StudentPortalKit";
import { prisma } from "@/lib/prisma";
import { createForumTopic, sendCourseMessage } from "@/app/(site)/student-lms-actions";

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
  const [progress, announcements, topics] = await Promise.all([
    getProgressMap(user.id, lessons.map(l => l.id)),
    prisma.announcement.findMany({ where: { visible: true, publishAt: { lte: new Date() }, AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }, { OR: [{ courseId }, { courseId: null }] }] }, orderBy: [{ pinned: "desc" }, { publishAt: "desc" }], take: 5 }),
    prisma.forumTopic.findMany({ where: { courseId }, orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }], include: { _count: { select: { replies: true } } }, take: 8 }),
  ]);
  const doneCount = lessons.filter(l => progress.get(l.id)).length;
  const pct = lessons.length ? clampPct((doneCount / lessons.length) * 100) : 0;
  const nextLesson = lessons.find(l => !progress.get(l.id)) ?? lessons[0];
  const duration = lessons.reduce((sum, lesson) => sum + (lesson.durationMin ?? 0), 0);

  return <main id="main" className="learning-page">
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
      {announcements.length > 0 && <section className="learning-about"><h2>{lang === "ar" ? "الإعلانات" : "Announcements"}</h2>{announcements.map((item) => <article key={item.id} style={{ padding: "12px 0", borderTop: "1px solid rgba(18,49,89,.1)" }}><b>{title(lang, item.titleAr, item.titleEn)}</b><p>{title(lang, item.bodyAr, item.bodyEn)}</p></article>)}</section>}
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
      <section className="learning-about"><h2>{lang === "ar" ? "التواصل والنقاش" : "Messages & discussion"}</h2><div style={{ display: "grid", gap: 18 }}><form action={sendCourseMessage.bind(null, courseId)}><input name="subject" placeholder={lang === "ar" ? "موضوع الرسالة" : "Subject"} style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 10 }}/><textarea name="body" required placeholder={lang === "ar" ? "رسالة إلى فريق المقرر" : "Message course staff"} style={{ width: "100%", minHeight: 80, padding: 10, border: "1px solid #ddd", borderRadius: 10, marginTop: 8 }}/><button className="learning-primary" type="submit">{lang === "ar" ? "إرسال الرسالة" : "Send"}</button></form><form action={createForumTopic.bind(null, courseId)}><input name="title" required placeholder={lang === "ar" ? "عنوان النقاش" : "Discussion title"} style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 10 }}/><textarea name="body" required placeholder={lang === "ar" ? "ابدأ نقاشًا مع زملائك" : "Start a discussion"} style={{ width: "100%", minHeight: 80, padding: 10, border: "1px solid #ddd", borderRadius: 10, marginTop: 8 }}/><button className="learning-primary" type="submit">{lang === "ar" ? "نشر النقاش" : "Post"}</button></form>{topics.map((topic) => <article key={topic.id} style={{ borderTop: "1px solid #ddd", paddingTop: 12 }}><b>{topic.pinned ? "★ " : ""}{topic.title}</b><p>{topic.body}</p><small>{topic._count.replies} {lang === "ar" ? "ردود" : "replies"}{topic.locked ? " · 🔒" : ""}</small></article>)}</div></section>
    </div></div></section>
    <StudentQuizAssignmentLinks lang={lang} courseId={courseId} />
  </main>;
}
