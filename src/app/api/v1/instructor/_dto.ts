/**
 * مُسقِطات ردود لوحة الأكاديميين — الموضع الوحيد الذي يُقرَّر فيه ما يخرج.
 *
 * نظير `api/v1/_dto.ts` للطالب، ومنفصلٌ عنه عمدًا: ما يراه المحاضر عن مقرّره
 * (حالة النشر، الظهور، بيانات طلابه) ليس ممّا يُعرض لطالب، والخلط بين
 * الملفّين يجعل إضافةً لأحد الطرفين تتسرّب إلى الآخر بلا انتباه.
 *
 * ⚠️ **`zoomStartUrl`** يظهر في هذا الملفّ في دالّتين اثنتين لا غير:
 * `instructorSession` و`instructorSessionDetail` — وكلتاهما لا تُستدعى إلّا
 * من مساري `/sessions` و`/sessions/[id]` بعد استعلامٍ مصفّى بـ`scholarId`،
 * فالمجلس لصاحبه قطعًا. وهو **غائب** عن `nextSessionBrief` (المستعملة في
 * `/summary`) وعن كل ما سواها. من يفتح هذا الرابط يصير مضيف المجلس.
 *
 * الأنواع مشتقّة من `Awaited<ReturnType<…>>` لا مكتوبةً يدويًّا: أيّ تغيير في
 * استعلامات `lib/instructor.ts` يظهر خطأَ ترجمةٍ هنا بدل أن يمرّ صامتًا.
 */
import type {
  getCourseStudents,
  getInstructorCourse,
  getInstructorCourses,
  getInstructorSession,
  getInstructorSessions,
  getInstructorStudents,
  getNextSession,
} from "@/lib/instructor";

type CourseRow = Awaited<ReturnType<typeof getInstructorCourses>>[number];
type CourseDetailRow = NonNullable<Awaited<ReturnType<typeof getInstructorCourse>>>;
type CourseStudentRow = Awaited<ReturnType<typeof getCourseStudents>>[number];
type StudentRow = Awaited<ReturnType<typeof getInstructorStudents>>[number];
type SessionRow = Awaited<ReturnType<typeof getInstructorSessions>>["upcoming"][number];
type SessionDetailRow = NonNullable<Awaited<ReturnType<typeof getInstructorSession>>>;
type NextSessionRow = NonNullable<Awaited<ReturnType<typeof getNextSession>>>;

// ---------------------------------------------------------------------------
// المقرّرات
// ---------------------------------------------------------------------------

/** بطاقة مقرّرٍ في قائمة «مقرّراتي». `lessonCount` يُحسب خارجًا ويُمرَّر. */
export function instructorCourseCard(c: CourseRow, lessonCount: number) {
  return {
    id: c.id,
    titleAr: c.titleAr,
    titleEn: c.titleEn,
    summaryAr: c.summaryAr ?? null,
    descAr: c.descAr ?? null,
    category: c.category ?? null,
    imageUrl: c.imageUrl ?? null,
    hours: c.hours ?? null,
    startsOn: c.startsOn,
    published: c.published,
    visible: c.visible,
    stage: c.stage ? { titleAr: c.stage.titleAr } : null,
    counts: {
      modules: c._count.modules,
      lessons: lessonCount,
      students: c._count.enrollments,
      sessions: c._count.sessions,
    },
  };
}

/** درسٌ في شجرة المحاضر — **بلا `videoUrl` ولا متن**: الشاشة للاطّلاع لا للعرض. */
function instructorLesson(l: CourseDetailRow["modules"][number]["lessons"][number]) {
  return {
    id: l.id,
    titleAr: l.titleAr,
    titleEn: l.titleEn,
    kind: l.kind,
    durationMin: l.durationMin ?? null,
    order: l.order,
    visible: l.visible,
    freePreview: l.freePreview,
    attachmentCount: l._count.attachments,
  };
}

export function instructorCourseDetail(c: CourseDetailRow) {
  return {
    id: c.id,
    titleAr: c.titleAr,
    titleEn: c.titleEn,
    summaryAr: c.summaryAr ?? null,
    descAr: c.descAr ?? null,
    imageUrl: c.imageUrl ?? null,
    hours: c.hours ?? null,
    startsOn: c.startsOn,
    published: c.published,
    visible: c.visible,
    stage: c.stage ? { titleAr: c.stage.titleAr } : null,
    modules: c.modules.map((m) => ({
      id: m.id,
      titleAr: m.titleAr,
      titleEn: m.titleEn,
      order: m.order,
      visible: m.visible,
      lessons: m.lessons.map(instructorLesson),
    })),
  };
}

/**
 * طالبٌ في مقرّر المحاضر. البريد والرقم الجامعي يخرجان لأنّ المحاضر مسؤولٌ
 * عن مراسلة طلابه — أمّا الهاتف والعنوان وما سواهما فلا شأن له بها.
 */
export function courseStudent(e: CourseStudentRow) {
  return {
    id: e.id,
    status: e.status,
    progressPct: e.progressPct,
    enrolledAt: e.enrolledAt,
    completedAt: e.completedAt,
    student: {
      id: e.user.id,
      name: e.user.name,
      email: e.user.email,
      studentNo: e.user.studentNo ?? null,
    },
  };
}

/** صفٌّ في «طلابي»: التسجيل ومقرّره معًا — الطالب الواحد قد يتكرّر بمقرّرين. */
export function instructorStudent(e: StudentRow) {
  return {
    id: e.id,
    status: e.status,
    progressPct: e.progressPct,
    enrolledAt: e.enrolledAt,
    student: {
      id: e.user.id,
      name: e.user.name,
      email: e.user.email,
      studentNo: e.user.studentNo ?? null,
      country: e.user.country ?? null,
    },
    course: { id: e.course.id, titleAr: e.course.titleAr },
  };
}

// ---------------------------------------------------------------------------
// المجالس
// ---------------------------------------------------------------------------

/**
 * مجلسٌ في قائمة المحاضر — **ومعه `zoomStartUrl`**.
 *
 * `isLiveNow` محسوبةٌ في طبقة القراءة (`live`) لا هنا: قراءة الساعة أثرٌ
 * جانبيّ، وحسابها مرّتين في مسارٍ واحد قد يعطي جوابين متنافرين.
 */
export function instructorSession(s: SessionRow) {
  return {
    id: s.id,
    titleAr: s.titleAr,
    titleEn: s.titleEn,
    descAr: s.descAr ?? null,
    startsAt: s.startsAt,
    endsAt: s.endsAt,
    durationMin: s.durationMin,
    provider: s.provider,
    isPublic: s.isPublic,
    visible: s.visible,
    isLiveNow: s.live,
    joinUrl: s.joinUrl ?? null,
    passcode: s.passcode ?? null,
    /** رابط المضيف — لصاحب المجلس وحده. لا يخرج من غير هذا المسار وأخيه. */
    zoomStartUrl: s.zoomStartUrl ?? null,
    recordingUrl: s.recordingUrl ?? null,
    recordingPasscode: s.recordingPasscode ?? null,
    course: s.course ? { id: s.course.id, titleAr: s.course.titleAr } : null,
    stage: s.stage ? { titleAr: s.stage.titleAr } : null,
    attendanceCount: s._count.attendance,
  };
}

export function instructorSessionDetail(s: SessionDetailRow) {
  const present = s.attendance.filter((a) => a.present).length;
  return {
    id: s.id,
    titleAr: s.titleAr,
    titleEn: s.titleEn,
    descAr: s.descAr ?? null,
    descEn: s.descEn ?? null,
    startsAt: s.startsAt,
    endsAt: s.endsAt,
    durationMin: s.durationMin,
    provider: s.provider,
    isPublic: s.isPublic,
    visible: s.visible,
    isLiveNow: s.live,
    ended: s.ended,
    joinUrl: s.joinUrl ?? null,
    passcode: s.passcode ?? null,
    /** رابط المضيف — لصاحب المجلس وحده. */
    zoomStartUrl: s.zoomStartUrl ?? null,
    recordingUrl: s.recordingUrl ?? null,
    recordingPasscode: s.recordingPasscode ?? null,
    course: s.course ? { id: s.course.id, titleAr: s.course.titleAr } : null,
    stage: s.stage ? { titleAr: s.stage.titleAr } : null,
    attendance: {
      total: s.attendance.length,
      present,
      rows: s.attendance.map((a) => ({
        id: a.id,
        joinedAt: a.joinedAt,
        leftAt: a.leftAt,
        minutes: a.minutes,
        present: a.present,
        source: a.source,
        student: {
          id: a.user.id,
          name: a.user.name,
          email: a.user.email,
          studentNo: a.user.studentNo ?? null,
        },
      })),
    },
  };
}

/**
 * المجلس القادم في بطاقة الملخّص — **بلا `zoomStartUrl`**.
 * زرّ البدء موضعه شاشة المجلس وحدها، ولا داعي لنشر الرابط في ردٍّ يُجلب
 * مع كل فتحةٍ للشاشة الرئيسة.
 */
export function nextSessionBrief(s: NextSessionRow) {
  return {
    id: s.id,
    titleAr: s.titleAr,
    startsAt: s.startsAt,
    durationMin: s.durationMin,
    course: s.course ? { titleAr: s.course.titleAr } : null,
  };
}
