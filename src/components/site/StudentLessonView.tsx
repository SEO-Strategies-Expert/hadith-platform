/**
 * صفحة الدرس داخل بوابة الطالب.
 *
 * تجمع ثلاثة أشياء يصعب فصلها: التحقّق من الصلاحيّة، والعرض بحسب نوع الدرس،
 * وتسجيل الإنجاز. التحقّق هنا هو الحارس الحقيقي — `src/proxy.ts` لا يغطّي
 * المسارات الفرعيّة لبوابة الطالب، فلا يجوز الاتّكال عليه.
 */
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/guard";
import type { Lang } from "@/lib/site-data";
import { longDate, mediaUrl } from "@/lib/site-format";
import { getCourseTree, flattenLessons, getProgressMap, isEnrolled, isLiveNow, title, timeLabel } from "@/lib/lms";
import { deleteStudentNote, saveStudentNote, toggleBookmark, toggleLessonDone } from "@/app/(site)/student-lms-actions";
import { Pill, studentHref, num, resolveVideo } from "@/components/site/StudentPortalKit";

const T = {
  ar: {
    kicker: "درس",
    course: "المقرّر",
    module: "الوحدة",
    backToCourse: "عودة إلى المقرّر",
    prev: "الدرس السابق",
    next: "الدرس التالي",
    markDone: "أنهيت هذا الدرس",
    undo: "تراجع عن الإنجاز",
    doneBadge: "منجَز",
    minutes: "دقيقة",
    preview: "معاينة مجّانيّة",
    previewNote:
      "أنت تطالع معاينة مجّانيّة من هذا المقرّر. تسجيل التقدّم متاحٌ للملتحقين بالمقرّر.",
    attachments: "مرفقات الدرس",
    download: "تنزيل",
    open: "فتح",
    noVideo: "لم يُضَف رابط هذا الدرس بعد.",
    openExternal: "فتح الدرس في تبويب جديد",
    externalNote:
      "رابط هذا الدرس من مصدر لا يدعم التضمين داخل الصفحة، فيُفتح في تبويب مستقلّ.",
    pdfTitle: "ملفّ الدرس",
    pdfNote: "افتح ملفّ الدرس أو نزّله للقراءة.",
    openPdf: "فتح الملفّ",
    noPdf: "لم يُرفع ملفّ هذا الدرس بعد.",
    liveTitle: "مجلس مباشر",
    liveNote: "هذا الدرس موعد مجلسٍ مباشر؛ يظهر زرّ الانضمام عند بدء البثّ.",
    join: "انضم الآن",
    liveNow: "مباشر الآن",
    recording: "شاهد التسجيل",
    noLive: "لم يُربَط بهذا الدرس مجلسٌ بعد.",
    quizTitle: "اختبار",
    quizNote: "هذا الدرس اختبارٌ تقويميّ. سيتاح أداؤه من هذه الصفحة عند فتحه.",
    quizPass: "درجة النجاح",
    quizTime: "زمن الاختبار",
    noQuiz: "لم يُربَط بهذا الدرس اختبارٌ بعد.",
    noText: "لم يُكتب متن هذا الدرس بعد.",
    kinds: {
      VIDEO: "درس مرئي",
      PDF: "ملفّ",
      TEXT: "متن مكتوب",
      LIVE: "مجلس مباشر",
      QUIZ: "اختبار",
    } as Record<string, string>,
    notes: "ملاحظاتي", addNote: "حفظ الملاحظة", notePlaceholder: "اكتب ملاحظتك على هذا الدرس…", bookmark: "حفظ كعلامة مرجعية", bookmarked: "إزالة العلامة المرجعية", transcript: "النص المفرّغ",
  },
  en: {
    kicker: "Lesson",
    course: "Course",
    module: "Module",
    backToCourse: "Back to course",
    prev: "Previous lesson",
    next: "Next lesson",
    markDone: "Mark this lesson complete",
    undo: "Mark as not complete",
    doneBadge: "Completed",
    minutes: "min",
    preview: "Free preview",
    previewNote:
      "You are viewing a free preview of this course. Progress tracking is available to enrolled students.",
    attachments: "Lesson attachments",
    download: "Download",
    open: "Open",
    noVideo: "No media link has been added to this lesson yet.",
    openExternal: "Open the lesson in a new tab",
    externalNote:
      "This lesson's link comes from a source that cannot be embedded, so it opens in a separate tab.",
    pdfTitle: "Lesson file",
    pdfNote: "Open or download the lesson file to read it.",
    openPdf: "Open the file",
    noPdf: "No file has been uploaded for this lesson yet.",
    liveTitle: "Live session",
    liveNote: "This lesson is a scheduled live session; the join button appears once it starts.",
    join: "Join now",
    liveNow: "Live now",
    recording: "Watch recording",
    noLive: "No live session is linked to this lesson yet.",
    quizTitle: "Quiz",
    quizNote: "This lesson is an assessment. It will be available from this page once opened.",
    quizPass: "Pass score",
    quizTime: "Time limit",
    noQuiz: "No quiz is linked to this lesson yet.",
    noText: "The text of this lesson has not been written yet.",
    kinds: {
      VIDEO: "Video lesson",
      PDF: "File",
      TEXT: "Written text",
      LIVE: "Live session",
      QUIZ: "Quiz",
    } as Record<string, string>,
    notes: "My notes", addNote: "Save note", notePlaceholder: "Write a note about this lesson…", bookmark: "Bookmark lesson", bookmarked: "Remove bookmark", transcript: "Transcript",
  },
} as const;

export async function StudentLessonView({ lang, lessonId }: { lang: Lang; lessonId: string }) {
  const t = T[lang];
  const user = await currentUser();

  // استعلامٌ أدنى أوّلًا: نحتاج المقرّر و`freePreview` قبل أي كشفٍ للمحتوى.
  // لا توجد دالّة مقابلة في `lib/lms.ts`، ولذلك يُقرأ هنا مباشرةً.
  const head = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      freePreview: true,
      visible: true,
      unlockAt: true,
      dripDays: true,
      prerequisiteLessonId: true,
      module: { select: { visible: true, courseId: true } },
    },
  });
  if (!head || !head.visible || !head.module.visible) notFound();

  const courseId = head.module.courseId;
  const enrolled = user?.id ? await isEnrolled(user.id, courseId) : false;

  if (enrolled && user?.id && user.role === "STUDENT") {
    const enrollment = await prisma.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId } }, select: { enrolledAt: true } });
    const dripAt = enrollment ? new Date(enrollment.enrolledAt.getTime() + head.dripDays * 86_400_000) : null;
    const prerequisiteDone = head.prerequisiteLessonId ? await prisma.lessonProgress.findUnique({ where: { userId_lessonId: { userId: user.id, lessonId: head.prerequisiteLessonId } }, select: { completed: true } }) : null;
    if ((head.unlockAt && head.unlockAt > new Date()) || (dripAt && dripAt > new Date()) || (head.prerequisiteLessonId && !prerequisiteDone?.completed)) notFound();
  }

  if (!enrolled && !head.freePreview) {
    // زائرٌ غير مسجَّل الدخول يُوجَّه للدخول؛ ومسجَّلٌ غير ملتحقٍ لا يُعلَم بوجود الدرس.
    if (!user?.id) redirect(lang === "en" ? "/en/student-login.html" : "/student-login.html");
    notFound();
  }

  const course = await getCourseTree(courseId);
  if (!course || !course.visible) notFound();

  const lessons = flattenLessons(course);
  const index = lessons.findIndex((l) => l.id === lessonId);
  if (index < 0) notFound(); // الدرس مخفيّ ضمن الشجرة المرئيّة — لا يُعرض
  const lesson = lessons[index];
  const prev = index > 0 ? lessons[index - 1] : null;
  const next = index < lessons.length - 1 ? lessons[index + 1] : null;

  // التقدّم للملتحقين فقط؛ المعاينة المجّانيّة قراءةٌ بلا تسجيل.
  const isDone =
    enrolled && user?.id ? (await getProgressMap(user.id, [lessonId])).get(lessonId) === true : false;
  const [notes, bookmarked] = enrolled && user?.id ? await Promise.all([
    prisma.studentNote.findMany({ where: { userId: user.id, lessonId }, orderBy: { createdAt: "desc" } }),
    prisma.bookmark.findUnique({ where: { userId_lessonId: { userId: user.id, lessonId } }, select: { id: true } }),
  ]) : [[], null];
  const transcript = lang === "en" ? lesson.transcriptEn || lesson.transcriptAr : lesson.transcriptAr || lesson.transcriptEn;

  return (
    <main id="main">
      <section className="page-hero orn-navy student-lesson-hero">
        <div className="container">
          <div className="page-hero-copy reveal">
            <p className="page-kicker">
              {t.kicker} {num(index + 1, lang)} / {num(lessons.length, lang)}
            </p>
            <h1 className="page-title thuluth gold-text">
              {title(lang, lesson.titleAr, lesson.titleEn)}
            </h1>
            <div className="page-meta">
              <span>
                {t.course}: {title(lang, course.titleAr, course.titleEn)}
              </span>
              <span>
                {t.module}: {title(lang, lesson.moduleTitleAr, lesson.moduleTitleEn)}
              </span>
              <span>{t.kinds[lesson.kind] ?? lesson.kind}</span>
              {lesson.durationMin ? (
                <span>
                  {num(lesson.durationMin, lang)} {t.minutes}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="inner-section white orn-cream student-lesson-material">
        <div className="container">
          {!enrolled && (
            <div className="callout reveal" style={{ marginBottom: 26 }}>
              <h3>{t.preview}</h3>
              <p>{t.previewNote}</p>
            </div>
          )}

          <LessonBody lang={lang} lesson={lesson} />

          {transcript && <details style={{ marginTop: 24 }}><summary style={{ cursor: "pointer", fontWeight: 800, color: "#123159" }}>{t.transcript}</summary><div className="naskh" style={{ whiteSpace: "pre-wrap", marginTop: 12, lineHeight: 1.9 }}>{transcript}</div></details>}

          {lesson.attachments.length > 0 && (
            <div style={{ marginTop: 34 }}>
              <header className="section-cap reveal">
                <h2 className="thuluth">{t.attachments}</h2>
              </header>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
                {lesson.attachments.map((a) => (
                  <li key={a.id}>
                    <a
                      href={mediaUrl(a.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={a.filename ?? undefined}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        flexWrap: "wrap",
                        padding: "12px 16px",
                        borderRadius: 12,
                        border: "1px solid rgba(18,49,89,.12)",
                        background: "rgba(255,255,255,.7)",
                        color: "#123159",
                        fontWeight: 800,
                      }}
                    >
                      <span aria-hidden="true">⬇</span>
                      <span style={{ flex: "1 1 200px" }}>{title(lang, a.titleAr, a.titleEn)}</span>
                      {a.sizeKb ? (
                        <Pill tone="muted">
                          {num(a.sizeKb, lang)} {lang === "ar" ? "ك.ب" : "KB"}
                        </Pill>
                      ) : null}
                      <Pill>{t.download}</Pill>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <section className="inner-section cream orn-cream">
        <div className="container">
          {/* زرّ الإنجاز نموذجٌ عاديّ — يعمل بلا JavaScript كبقيّة الموقع */}
          {enrolled && (
            <div style={{ display: "grid", gap: 22 }}>
            <form action={toggleLessonDone.bind(null, lesson.id, !isDone)}>
              <div
                style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}
              >
                <button className={isDone ? "btn btn-outline-ink" : "btn btn-gold"} type="submit">
                  {isDone ? t.undo : t.markDone}
                </button>
                {isDone && <Pill>{t.doneBadge} ✓</Pill>}
              </div>
            </form>
            <form action={toggleBookmark.bind(null, lesson.id)}><button className="btn btn-outline-ink" type="submit">{bookmarked ? t.bookmarked : t.bookmark} {bookmarked ? "★" : "☆"}</button></form>
            <div className="callout"><h3>{t.notes}</h3><form action={saveStudentNote.bind(null, lesson.id)}><textarea name="body" required maxLength={10000} placeholder={t.notePlaceholder} style={{ width: "100%", minHeight: 100, border: "1px solid rgba(18,49,89,.18)", borderRadius: 12, padding: 12, margin: "12px 0" }} /><button className="btn btn-gold" type="submit">{t.addNote}</button></form>
            {notes.map((note) => <div key={note.id} style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(18,49,89,.1)", whiteSpace: "pre-wrap" }}>{note.body}<form action={deleteStudentNote.bind(null, note.id, lesson.id)} style={{ display: "inline", marginInlineStart: 12 }}><button type="submit" style={{ color: "#9b2c2c", background: "none", border: 0, cursor: "pointer" }}>×</button></form></div>)}</div>
            </div>
          )}

          <nav
            style={{
              display: "flex",
              gap: 14,
              flexWrap: "wrap",
              justifyContent: "space-between",
              marginTop: 26,
            }}
          >
            {prev ? (
              <Link className="btn btn-outline-ink" href={studentHref(lang, `/lesson/${prev.id}`)}>
                {lang === "ar" ? "→" : "←"} {t.prev}
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link className="btn btn-gold" href={studentHref(lang, `/lesson/${next.id}`)}>
                {t.next} {lang === "ar" ? "←" : "→"}
              </Link>
            ) : (
              <span />
            )}
          </nav>
        </div>
      </section>
    </main>
  );
}

// ---------------------------------------------------------------------------
// العرض بحسب نوع الدرس
// ---------------------------------------------------------------------------

type FlatLesson = ReturnType<typeof flattenLessons>[number];

async function LessonBody({ lang, lesson }: { lang: Lang; lesson: FlatLesson }) {
  const t = T[lang];

  if (lesson.kind === "TEXT") {
    const body = lang === "en" ? lesson.bodyEn || lesson.bodyAr : lesson.bodyAr || lesson.bodyEn;
    if (!body) return <p>{t.noText}</p>;
    // المصدر هنا **لوحة التحكم** لا مُدخَلات المستخدمين: متن الدرس يكتبه محرّر
    // معتمَد ويُخزَّن HTML، تمامًا كما تفعل `PageRenderer` بمحتوى الصفحات.
    return (
      <div
        className="naskh"
        style={{ maxWidth: 860, lineHeight: 1.95, color: "#1c2a3d" }}
        dangerouslySetInnerHTML={{ __html: body }}
      />
    );
  }

  if (lesson.kind === "PDF") {
    // لا حقل ملفّ مستقلّ في المخطّط: الملفّ يُخزَّن في `videoUrl` أو يُرفع مرفقًا،
    // فنقبل الاثنين حتى لا تُعرض صفحةٌ خاوية.
    const href = mediaUrl(lesson.videoUrl) || mediaUrl(lesson.attachments[0]?.url);
    return (
      <div className="callout reveal">
        <h3>{t.pdfTitle}</h3>
        <p>{href ? t.pdfNote : t.noPdf}</p>
        {href && (
          <div className="page-actions" style={{ marginTop: 18 }}>
            <a className="btn btn-gold" href={href} target="_blank" rel="noopener noreferrer">
              {t.openPdf}
            </a>
          </div>
        )}
      </div>
    );
  }

  if (lesson.kind === "LIVE") return <LiveLessonCard lang={lang} lesson={lesson} />;
  if (lesson.kind === "QUIZ") return <QuizLessonCard lang={lang} lesson={lesson} />;

  // VIDEO (والافتراضي): مشغّل مضمَّن، أو ملفّ، أو رابط خارجي — بلا مشغّل فارغ.
  const video = resolveVideo(lesson.videoUrl);
  if (!video) return <p>{t.noVideo}</p>;

  if (video.mode === "iframe") {
    return (
      <div
        style={{
          position: "relative",
          paddingTop: "56.25%",
          borderRadius: 16,
          overflow: "hidden",
          border: "1px solid rgba(18,49,89,.14)",
          background: "#0B2144",
        }}
      >
        <iframe
          src={video.src}
          title={title(lang, lesson.titleAr, lesson.titleEn)}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
        />
      </div>
    );
  }

  if (video.mode === "file") {
    return (
      <video
        controls
        preload="metadata"
        src={video.src}
        style={{
          width: "100%",
          borderRadius: 16,
          border: "1px solid rgba(18,49,89,.14)",
          background: "#0B2144",
        }}
      />
    );
  }

  return (
    <div className="callout reveal">
      <h3>{t.kinds.VIDEO}</h3>
      <p>{t.externalNote}</p>
      <div className="page-actions" style={{ marginTop: 18 }}>
        <a className="btn btn-gold" href={video.src} target="_blank" rel="noopener noreferrer">
          {t.openExternal}
        </a>
      </div>
    </div>
  );
}

async function LiveLessonCard({ lang, lesson }: { lang: Lang; lesson: FlatLesson }) {
  const t = T[lang];
  const session = lesson.sessionId
    ? await prisma.liveSession.findFirst({
        where: { id: lesson.sessionId, visible: true },
        // `zoomStartUrl` رابط المضيف ولا يُرسل للطلاب أبدًا — نختار الحقول صراحةً.
        select: {
          titleAr: true,
          titleEn: true,
          descAr: true,
          descEn: true,
          startsAt: true,
          endsAt: true,
          durationMin: true,
          joinUrl: true,
          recordingUrl: true,
        },
      })
    : null;

  if (!session) {
    return (
      <div className="callout reveal">
        <h3>{t.liveTitle}</h3>
        <p>{t.noLive}</p>
      </div>
    );
  }

  const live = isLiveNow(session);
  const end = (session.endsAt ?? new Date(session.startsAt.getTime() + session.durationMin * 60_000)).getTime();
  const ended = Date.now() > end;

  return (
    <div className="callout reveal">
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        <Pill tone={live ? "gold" : "navy"}>{live ? t.liveNow : t.liveTitle}</Pill>
        <Pill tone="muted">
          {num(session.durationMin, lang)} {t.minutes}
        </Pill>
      </div>
      <h3>{title(lang, session.titleAr, session.titleEn)}</h3>
      <p style={{ fontWeight: 800 }}>
        {longDate(session.startsAt, lang, { arabicDigits: lang === "ar" })} —{" "}
        {timeLabel(session.startsAt, lang)}
      </p>
      {title(lang, session.descAr, session.descEn) && (
        <p>{title(lang, session.descAr, session.descEn)}</p>
      )}
      {!live && !ended && <p>{t.liveNote}</p>}
      <div className="page-actions" style={{ marginTop: 18 }}>
        {live && session.joinUrl && (
          <a className="btn btn-gold" href={session.joinUrl} target="_blank" rel="noopener noreferrer">
            {t.join}
          </a>
        )}
        {ended && session.recordingUrl && (
          <a
            className="btn btn-outline-ink"
            href={session.recordingUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t.recording}
          </a>
        )}
      </div>
    </div>
  );
}

async function QuizLessonCard({ lang, lesson }: { lang: Lang; lesson: FlatLesson }) {
  const t = T[lang];
  const quiz = lesson.quizId
    ? await prisma.quiz.findFirst({
        where: { id: lesson.quizId, visible: true },
        select: {
          titleAr: true,
          titleEn: true,
          descAr: true,
          descEn: true,
          passScore: true,
          timeLimitMin: true,
        },
      })
    : null;

  return (
    <div className="callout reveal">
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        <Pill tone="navy">{t.quizTitle}</Pill>
        {quiz?.timeLimitMin ? (
          <Pill tone="muted">
            {t.quizTime}: {num(quiz.timeLimitMin, lang)} {t.minutes}
          </Pill>
        ) : null}
        {quiz ? (
          <Pill tone="muted">
            {t.quizPass}: {num(quiz.passScore, lang)}
            {lang === "ar" ? "٪" : "%"}
          </Pill>
        ) : null}
      </div>
      <h3>{quiz ? title(lang, quiz.titleAr, quiz.titleEn) : t.quizTitle}</h3>
      <p>{quiz ? title(lang, quiz.descAr, quiz.descEn) || t.quizNote : t.noQuiz}</p>
    </div>
  );
}
