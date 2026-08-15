import { apiRequest } from './client';

/**
 * لوحة الأكاديميين — أنواعها ونداءاتها.
 *
 * ملفٌّ مستقلّ عن `endpoints.ts` عمدًا: تلك واجهة الطالب والزائر، وهذه واجهة
 * المحاضر. فصلُهما يجعل «ما الذي يصل إلى شاشة المحاضر؟» قراءةَ ملفٍّ واحد،
 * ويمنع أن يستدعي سهوًا مسارَ محاضرٍ من شاشةِ طالب.
 *
 * الأنواع منقولة عن عقد `/api/v1/instructor/**` حرفًا بحرف. التواريخ نصوص
 * ISO كما تصل من JSON.
 *
 * ⚠️ **`zoomStartUrl`** — رابط المضيف — موجودٌ في نوعين اثنين لا غير:
 * `InstructorSession` و`InstructorSessionDetail`، وهما ما يردّه مسارا
 * المجالس وحدهما. من فتح هذا الرابط صار مضيف المجلس، فلا يُعرض إلّا خلف
 * تحذيرٍ صريح ولا يُوضع قطّ حيث يُظنّ أنّه رابط الطلاب.
 */

/** يميّز الحساب المحاضر الذي لم تربطه الإدارة بملفّ الهيئة العلميّة. */
export type ScholarLinked = { scholarLinked: boolean };

export type EnrollmentStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type InstructorLessonKind = 'VIDEO' | 'PDF' | 'TEXT' | 'LIVE' | 'QUIZ';

export type StudentBrief = {
  id: string;
  name: string;
  email: string;
  studentNo: string | null;
};

/* ————— الملخّص ————— */

export type NextSessionBrief = {
  id: string;
  titleAr: string;
  startsAt: string;
  durationMin: number;
  course: { titleAr: string } | null;
};

export type InstructorSummary = ScholarLinked & {
  name: string;
  role: 'INSTRUCTOR' | 'ADMIN';
  /** اسم عضو الهيئة المرتبط بالحساب، أو `null` إن لم يُربط. */
  scholarName: string | null;
  coursesCount: number;
  studentsCount: number;
  pendingGrading: number;
  nextSession: NextSessionBrief | null;
};

/* ————— المقرّرات ————— */

export type InstructorCourseCard = {
  id: string;
  titleAr: string;
  titleEn: string;
  summaryAr: string | null;
  descAr: string | null;
  category: string | null;
  imageUrl: string | null;
  hours: number | null;
  startsOn: string | null;
  published: boolean;
  visible: boolean;
  stage: { titleAr: string } | null;
  counts: { modules: number; lessons: number; students: number; sessions: number };
};

export type InstructorLesson = {
  id: string;
  titleAr: string;
  titleEn: string;
  kind: InstructorLessonKind;
  durationMin: number | null;
  order: number;
  visible: boolean;
  freePreview: boolean;
  attachmentCount: number;
};

export type InstructorModule = {
  id: string;
  titleAr: string;
  titleEn: string;
  order: number;
  visible: boolean;
  lessons: InstructorLesson[];
};

export type CourseStudentRow = {
  id: string;
  status: EnrollmentStatus;
  progressPct: number;
  enrolledAt: string;
  completedAt: string | null;
  student: StudentBrief;
};

export type InstructorCourseDetail = {
  id: string;
  titleAr: string;
  titleEn: string;
  summaryAr: string | null;
  descAr: string | null;
  imageUrl: string | null;
  hours: number | null;
  startsOn: string | null;
  published: boolean;
  visible: boolean;
  stage: { titleAr: string } | null;
  modules: InstructorModule[];
  counts: { modules: number; lessons: number; students: number };
  students: CourseStudentRow[];
};

/* ————— المجالس ————— */

export type InstructorSession = {
  id: string;
  titleAr: string;
  titleEn: string;
  descAr: string | null;
  startsAt: string;
  endsAt: string | null;
  durationMin: number;
  provider: string;
  isPublic: boolean;
  visible: boolean;
  isLiveNow: boolean;
  /** رابط الطلاب — هذا ما يُشارَك. */
  joinUrl: string | null;
  passcode: string | null;
  /** ⚠️ رابط المضيف — لا يُشارَك مع أحد. */
  zoomStartUrl: string | null;
  recordingUrl: string | null;
  recordingPasscode: string | null;
  course: { id: string; titleAr: string } | null;
  stage: { titleAr: string } | null;
  attendanceCount: number;
};

export type AttendanceRow = {
  id: string;
  joinedAt: string;
  leftAt: string | null;
  minutes: number;
  present: boolean;
  /** `zoom` = من تقرير المنصّة، `manual` = تسجيل يدويّ من الإدارة. */
  source: string;
  student: StudentBrief;
};

export type InstructorSessionDetail = Omit<InstructorSession, 'attendanceCount'> & {
  descEn: string | null;
  ended: boolean;
  attendance: { total: number; present: number; rows: AttendanceRow[] };
};

/* ————— الطلاب ————— */

export type InstructorStudentRow = {
  id: string;
  status: EnrollmentStatus;
  progressPct: number;
  enrolledAt: string;
  student: StudentBrief & { country: string | null };
  course: { id: string; titleAr: string };
};

/* ————————————— النداءات ————————————— */

export const getInstructorSummary = () =>
  apiRequest<InstructorSummary>('/instructor/summary', { auth: true });

export const getInstructorCourses = (args?: { limit?: number; cursor?: string | null }) =>
  apiRequest<ScholarLinked & { items: InstructorCourseCard[]; nextCursor: string | null }>(
    '/instructor/courses',
    { auth: true, query: { limit: args?.limit, cursor: args?.cursor ?? undefined } }
  );

export const getInstructorCourse = (id: string) =>
  apiRequest<InstructorCourseDetail>(`/instructor/courses/${id}`, { auth: true });

/**
 * لا تقبل مؤشّرًا: القائمة مقسومة قادمة/منتهية، و`limit` يقصّ **المنتهية**
 * وحدها — القادمة قائمةُ عملٍ يحتاجها المحاضر كاملةً.
 */
export const getInstructorSessions = (limit = 30) =>
  apiRequest<ScholarLinked & { upcoming: InstructorSession[]; past: InstructorSession[] }>(
    '/instructor/sessions',
    { auth: true, query: { limit } }
  );

export const getInstructorSession = (id: string) =>
  apiRequest<InstructorSessionDetail>(`/instructor/sessions/${id}`, { auth: true });

export const getInstructorStudents = (args?: { limit?: number; cursor?: string | null }) =>
  apiRequest<
    ScholarLinked & { items: InstructorStudentRow[]; nextCursor: string | null; total: number }
  >('/instructor/students', {
    auth: true,
    query: { limit: args?.limit, cursor: args?.cursor ?? undefined },
  });
