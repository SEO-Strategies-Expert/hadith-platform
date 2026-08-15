/**
 * أنواع ردود الواجهة — منقولة حرفًا بحرف عن عقد `/api/v1`.
 * أي تعديل هنا يجب أن يتبع تعديلًا في العقد لا العكس.
 */

/* ————— المصادقة ————— */

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
  user?: { id: string; name: string; email: string; role: string };
};

/* ————— كائنات مشتركة ————— */

export type Bilingual = { titleAr: string; titleEn: string };

export type StageRef = {
  id: string;
  key: string;
  titleAr: string;
  titleEn: string;
  numAr: string | null;
  numEn: string | null;
};

export type InstructorRef = {
  id: string;
  nameAr: string;
  nameEn: string;
  rankAr: string | null;
  rankEn: string | null;
  photoUrl: string | null;
};

export type CourseCard = {
  id: string;
  titleAr: string;
  titleEn: string;
  descAr: string | null;
  descEn: string | null;
  summaryAr: string | null;
  summaryEn: string | null;
  category: string | null;
  metaAr: string | null;
  metaEn: string | null;
  imageUrl: string | null;
  hours: number | null;
  startsOn: string | null;
  stage: StageRef | null;
  instructor: InstructorRef | null;
  /** `null` حين لا يُحسب (في `/me/courses`). */
  lessonCount: number | null;
};

export type LessonKind = 'VIDEO' | 'PDF' | 'TEXT' | 'LIVE' | 'QUIZ';

export type LessonAttachment = {
  id: string;
  titleAr: string;
  titleEn: string;
  url: string;
  filename: string;
  sizeKb: number | null;
};

export type LessonLocked = {
  id: string;
  titleAr: string;
  titleEn: string;
  kind: LessonKind;
  durationMin: number | null;
  freePreview: boolean;
  order: number;
  attachmentCount: number;
  locked: true;
  done: boolean | null;
};

export type LessonFull = {
  id: string;
  titleAr: string;
  titleEn: string;
  kind: LessonKind;
  durationMin: number | null;
  freePreview: boolean;
  order: number;
  videoUrl: string | null;
  bodyAr: string | null;
  bodyEn: string | null;
  sessionId: string | null;
  quizId: string | null;
  attachments: LessonAttachment[];
  locked: false;
  done: boolean | null;
};

export type Lesson = LessonLocked | LessonFull;

export type CourseModule = {
  id: string;
  titleAr: string;
  titleEn: string;
  descAr: string | null;
  descEn: string | null;
  order: number;
  lessons: Lesson[];
};

export type SessionPublic = {
  id: string;
  titleAr: string;
  titleEn: string;
  descAr: string | null;
  descEn: string | null;
  startsAt: string;
  endsAt: string | null;
  durationMin: number | null;
  provider: string | null;
  isPublic: boolean;
  isLiveNow: boolean;
  course: (Bilingual & { id: string }) | null;
  instructor: InstructorRef | null;
  /** `null` إلّا داخل نافذة البثّ. */
  joinUrl: string | null;
  passcode: string | null;
  hasRecording: boolean;
};

export type SessionStudent = Omit<SessionPublic, 'hasRecording'> & {
  recordingUrl: string | null;
  recordingPasscode: string | null;
};

export type QuestionKind = 'SINGLE' | 'MULTI' | 'TRUEFALSE' | 'SHORT';

export type SafeChoice = { id: string; textAr: string; textEn: string };

/** سؤال قبل التسليم — بلا `correct` ولا شرح. */
export type SafeQuestion = {
  id: string;
  kind: QuestionKind;
  textAr: string;
  textEn: string;
  points: number;
  choices: SafeChoice[];
};

export type RevealedChoice = SafeChoice & { correct: boolean; selected: boolean };

export type QuestionOutcome = {
  awarded: number;
  /** `null` تعني «لم يُصحَّح بعد» لا «خطأ». */
  correct: boolean | null;
  manual: boolean;
  answered: boolean;
  textAnswer: string | null;
  selectedChoiceIds: string[];
};

export type RevealedQuestion = {
  id: string;
  kind: QuestionKind;
  textAr: string;
  textEn: string;
  points: number;
  explainAr: string | null;
  explainEn: string | null;
  choices: RevealedChoice[];
  outcome: QuestionOutcome | null;
};

export type QuizCard = {
  id: string;
  titleAr: string;
  titleEn: string;
  descAr: string | null;
  descEn: string | null;
  /** `null` = بلا توقيت. */
  timeLimitMin: number | null;
  passScore: number;
  /** `0` = بلا حدّ. */
  attemptsAllowed: number;
  course: (Bilingual & { id: string }) | null;
};

export type AttemptBrief = {
  id: string;
  startedAt: string;
  submittedAt: string | null;
  score: number | null;
  passed: boolean | null;
};

export type OpenAttempt = AttemptBrief & {
  deadline: string | null;
  expired: boolean;
  questions: SafeQuestion[];
};

export type AttemptResult = AttemptBrief & {
  /** وصل التسليم بعد المهلة + التسامح ⇒ أُهملت الإجابات. */
  late: boolean;
  autoPoints: number;
  earnedPoints: number;
  manualPoints: number;
  needsManualReview: boolean;
  questions: RevealedQuestion[];
};

export type SubmissionState = 'DRAFT' | 'SUBMITTED' | 'RETURNED' | 'GRADED';

export type Submission = {
  id: string;
  state: SubmissionState;
  text: string | null;
  fileUrl: string | null;
  fileName: string | null;
  submittedAt: string | null;
  score: number | null;
  feedback: string | null;
  gradedAt: string | null;
};

/* ————— ردود المسارات ————— */

export type Paged<T> = { items: T[]; nextCursor: string | null };

export type NewsItem = {
  id: string;
  slug: string | null;
  titleAr: string;
  titleEn: string;
  excerptAr: string | null;
  excerptEn: string | null;
  imageUrl: string | null;
  tagAr: string | null;
  tagEn: string | null;
  date: string;
  featured: boolean;
};

export type NewsDetail = NewsItem & { bodyAr: string | null; bodyEn: string | null };

export type FacultyMember = {
  id: string;
  nameAr: string;
  nameEn: string;
  rankAr: string | null;
  rankEn: string | null;
  specAr: string | null;
  specEn: string | null;
  bioAr: string | null;
  bioEn: string | null;
  photoUrl: string | null;
  countryAr: string | null;
  countryEn: string | null;
  isCouncil: boolean;
  isCouncilHead: boolean;
  order: number;
};

export type CourseDetailPublic = CourseCard & {
  freePreviewCount: number;
  modules: CourseModule[];
};

export type CourseDetailStudent = CourseCard & {
  modules: CourseModule[];
  progress: { total: number; done: number; pct: number };
};

export type Me = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  avatarUrl: string | null;
  studentNo: string | null;
  phone: string | null;
  country: string | null;
  program: string | null;
  createdAt: string;
  counts: { courses: number; unreadNotifications: number; certificates: number };
};

export type EnrollmentStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export type MyCourse = {
  enrollmentId: string;
  status: EnrollmentStatus;
  feeOption: 'free' | 'reduced' | 'full' | null;
  progressPct: number;
  enrolledAt: string;
  completedAt: string | null;
  course: CourseCard;
};

export type LessonDetail = LessonFull & {
  module: Bilingual & { id: string };
  course: Bilingual & { id: string };
  enrolled: boolean;
  prev: (Bilingual & { id: string }) | null;
  next: (Bilingual & { id: string }) | null;
  session: SessionStudent | null;
  quiz: { id: string; titleAr: string; titleEn: string; passScore: number; timeLimitMin: number | null } | null;
};

export type ProgressResult = {
  lessonId: string;
  done: boolean;
  courseId: string;
  progressPct: number;
  enrollmentStatus: string | null;
};

export type QuizOverview = {
  quiz: QuizCard;
  questionCount: number;
  attemptsUsed: number;
  /** `null` = بلا حدّ. */
  attemptsLeft: number | null;
  canStart: boolean;
  openAttempt: OpenAttempt | null;
  lastAttempt: AttemptBrief | null;
  attempts: AttemptBrief[];
};

export type StartAttemptResult = {
  resumed: boolean;
  quiz: QuizCard;
  attempt: OpenAttempt;
};

export type SubmitAttemptResult = {
  alreadySubmitted: boolean;
  quiz: QuizCard;
  result: AttemptResult;
};

export type AttemptView =
  | { submitted: false; quiz: QuizCard; attempt: AttemptBrief & { deadline: string | null; expired: boolean }; result: null }
  | { submitted: true; quiz: QuizCard; attempt: AttemptBrief; result: AttemptResult };

export type Assignment = {
  id: string;
  titleAr: string;
  titleEn: string;
  descAr: string | null;
  descEn: string | null;
  dueAt: string | null;
  maxScore: number;
  course: Bilingual & { id: string };
  submission: Submission | null;
  overdue: boolean;
};

export type AssignmentDetail = Assignment & { courseId: string };

export type Certificate = {
  id: string;
  kind: 'CERTIFICATE' | 'IJAZA';
  titleAr: string;
  titleEn: string;
  serial: string;
  verifyCode: string;
  issuedAt: string;
  revoked: boolean;
  pdfUrl: string | null;
  isnadAr: string | null;
  isnadEn: string | null;
  grantedByAr: string | null;
  grantedByEn: string | null;
  course: Bilingual | null;
  stage: Bilingual | null;
  verifyCodeFormatted: string;
  verifyPathAr: string;
  verifyPathEn: string;
};

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'WAIVED';

export type Payment = {
  id: string;
  /** نصّ عشريّ — لا يُحوَّل إلى عدد عائم. */
  amount: string;
  currency: string;
  status: PaymentStatus;
  method: string | null;
  paidAt: string | null;
  createdAt: string;
  enrollmentId: string | null;
  course: (Bilingual & { id: string }) | null;
};

export type PaymentTotals = {
  currency: string;
  collected: string;
  pending: string;
  waived: string;
  refunded: string;
  failed: string;
  net: string;
  counts: { total: number; paid: number; pending: number; waived: number; refunded: number; failed: number };
};

export type PaymentsPage = Paged<Payment> & { totals: PaymentTotals[] | null };

export type NotificationKind =
  | 'session'
  | 'assignment'
  | 'grade'
  | 'certificate'
  | 'payment'
  | 'announcement';

export type AppNotification = {
  id: string;
  kind: NotificationKind;
  titleAr: string;
  titleEn: string;
  bodyAr: string | null;
  bodyEn: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

export type NotificationsPage = Paged<AppNotification> & { unreadCount: number };

export type DeviceRegistration = {
  id: string;
  platform: string;
  deviceId: string | null;
  appVersion: string | null;
  lastSeenAt: string;
  createdAt: string;
};
