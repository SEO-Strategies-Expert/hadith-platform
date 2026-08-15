/**
 * مُسقِطات الردود (DTO) — الموضع الوحيد الذي يُقرَّر فيه **ما يخرج** إلى التطبيق.
 *
 * لماذا ملفّ مستقلّ؟ لأنّ منع التسريب لا يُحرس بالانتباه في كل مسار على حدة.
 * جمعُ الإسقاط هنا يجعل مراجعة «ما الذي يخرج؟» قراءةَ ملفٍّ واحد، وكل دالّة
 * تُصرّح بحقولها واحدًا واحدًا فلا يمرّ حقلٌ جديد يُضاف إلى المخطّط لاحقًا
 * إلى الشبكة من تلقاء نفسه.
 *
 * ثلاثة حقول ممنوعة في كل ما هنا مهما كان المستدعي:
 *   • `LiveSession.zoomStartUrl` — رابط المضيف؛ من يملكه يفتتح المجلس باسم المحاضر.
 *   • `Choice.correct` و`Question.explainAr/En` — إلّا في `revealedQuestion`
 *     المستعملة بعد التسليم وحده.
 *   • `User.passwordHash` و`RefreshToken.tokenHash` — لا تُقرأ هنا أصلًا.
 */
import { isLiveNow } from "@/lib/lms";
import { toMinor, minorToPlain } from "@/lib/payments";
import type { QuestionOutcome } from "@/lib/quiz";

// ---------------------------------------------------------------------------
// كيانات صغيرة مشتركة
// ---------------------------------------------------------------------------

export interface ScholarLike {
  id: string;
  nameAr: string;
  nameEn: string;
  rankAr?: string | null;
  rankEn?: string | null;
  photoUrl?: string | null;
}

/** بطاقة محاضر مختصرة — بلا سيرة ولا بريد ولا ارتباط بحسابه. */
export function scholarBrief(s: ScholarLike | null | undefined) {
  if (!s) return null;
  return {
    id: s.id,
    nameAr: s.nameAr,
    nameEn: s.nameEn,
    rankAr: s.rankAr ?? null,
    rankEn: s.rankEn ?? null,
    photoUrl: s.photoUrl ?? null,
  };
}

export interface StageLike {
  id: string;
  key: string;
  titleAr: string;
  titleEn: string;
  numAr?: string | null;
  numEn?: string | null;
}

export function stageBrief(st: StageLike | null | undefined) {
  if (!st) return null;
  return {
    id: st.id,
    key: st.key,
    titleAr: st.titleAr,
    titleEn: st.titleEn,
    numAr: st.numAr ?? null,
    numEn: st.numEn ?? null,
  };
}

export interface CourseLike {
  id: string;
  titleAr: string;
  titleEn: string;
  descAr?: string | null;
  descEn?: string | null;
  summaryAr?: string | null;
  summaryEn?: string | null;
  category?: string | null;
  metaAr?: string | null;
  metaEn?: string | null;
  imageUrl?: string | null;
  hours?: number | null;
  startsOn?: Date | null;
  stage?: StageLike | null;
  instructor?: ScholarLike | null;
}

/** بطاقة مقرّر للقوائم. `lessonCount` يُحسب خارجًا ويُمرَّر. */
export function courseCard(c: CourseLike, lessonCount: number | null = null) {
  return {
    id: c.id,
    titleAr: c.titleAr,
    titleEn: c.titleEn,
    descAr: c.descAr ?? null,
    descEn: c.descEn ?? null,
    summaryAr: c.summaryAr ?? null,
    summaryEn: c.summaryEn ?? null,
    category: c.category ?? null,
    metaAr: c.metaAr ?? null,
    metaEn: c.metaEn ?? null,
    imageUrl: c.imageUrl ?? null,
    hours: c.hours ?? null,
    startsOn: c.startsOn ?? null,
    stage: stageBrief(c.stage),
    instructor: scholarBrief(c.instructor),
    lessonCount,
  };
}

// ---------------------------------------------------------------------------
// الدروس
// ---------------------------------------------------------------------------

export interface AttachmentLike {
  id: string;
  titleAr: string;
  titleEn: string;
  url: string;
  filename?: string | null;
  sizeKb?: number | null;
}

export function attachment(a: AttachmentLike) {
  return {
    id: a.id,
    titleAr: a.titleAr,
    titleEn: a.titleEn,
    url: a.url,
    filename: a.filename ?? null,
    sizeKb: a.sizeKb ?? null,
  };
}

export interface LessonLike {
  id: string;
  titleAr: string;
  titleEn: string;
  kind: string;
  durationMin?: number | null;
  freePreview: boolean;
  order: number;
  videoUrl?: string | null;
  bodyAr?: string | null;
  bodyEn?: string | null;
  sessionId?: string | null;
  quizId?: string | null;
  attachments?: AttachmentLike[];
}

/**
 * درسٌ **بعنوانه فقط**. يُستعمل في المسار العامّ لغير المسجَّل: لا `videoUrl`
 * ولا متن ولا مرفقات. `locked` يقول للتطبيق صراحةً لماذا لا محتوى.
 */
export function lessonTitleOnly(l: LessonLike, done: boolean | null = null) {
  return {
    id: l.id,
    titleAr: l.titleAr,
    titleEn: l.titleEn,
    kind: l.kind,
    durationMin: l.durationMin ?? null,
    freePreview: l.freePreview,
    order: l.order,
    attachmentCount: l.attachments?.length ?? 0,
    locked: true,
    done,
  };
}

/** الدرس بمحتواه — لا يُستدعى إلّا بعد `isEnrolled` أو `freePreview`. */
export function lessonFull(l: LessonLike, done: boolean | null = null) {
  return {
    id: l.id,
    titleAr: l.titleAr,
    titleEn: l.titleEn,
    kind: l.kind,
    durationMin: l.durationMin ?? null,
    freePreview: l.freePreview,
    order: l.order,
    videoUrl: l.videoUrl ?? null,
    bodyAr: l.bodyAr ?? null,
    bodyEn: l.bodyEn ?? null,
    sessionId: l.sessionId ?? null,
    quizId: l.quizId ?? null,
    attachments: (l.attachments ?? []).map(attachment),
    locked: false,
    done,
  };
}

export interface ModuleLike {
  id: string;
  titleAr: string;
  titleEn: string;
  descAr?: string | null;
  descEn?: string | null;
  order: number;
  lessons: LessonLike[];
}

/**
 * شجرة الوحدات. `unlock` يقرّر لكل درس: أيُعطى محتواه أم عنوانه وحده؟
 * تمريره دالّةً يجعل المسار العامّ والمسار المسجَّل يتشاركان نفس البنية
 * ويختلفان في سطرٍ واحد لا في نسخة كاملة.
 */
export function moduleTree(
  modules: ModuleLike[],
  unlock: (l: LessonLike) => boolean,
  progress?: Map<string, boolean>
) {
  return modules.map((m) => ({
    id: m.id,
    titleAr: m.titleAr,
    titleEn: m.titleEn,
    descAr: m.descAr ?? null,
    descEn: m.descEn ?? null,
    order: m.order,
    lessons: m.lessons.map((l) => {
      const done = progress ? (progress.get(l.id) ?? false) : null;
      return unlock(l) ? lessonFull(l, done) : lessonTitleOnly(l, done);
    }),
  }));
}

// ---------------------------------------------------------------------------
// المجالس المباشرة
// ---------------------------------------------------------------------------

export interface SessionLike {
  id: string;
  titleAr: string;
  titleEn: string;
  descAr?: string | null;
  descEn?: string | null;
  startsAt: Date;
  endsAt: Date | null;
  durationMin: number;
  provider: string;
  joinUrl?: string | null;
  passcode?: string | null;
  recordingUrl?: string | null;
  recordingPasscode?: string | null;
  isPublic: boolean;
  course?: { id: string; titleAr: string; titleEn: string } | null;
  instructor?: ScholarLike | null;
}

function sessionBase(s: SessionLike) {
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
    isLiveNow: isLiveNow(s),
    course: s.course ? { id: s.course.id, titleAr: s.course.titleAr, titleEn: s.course.titleEn } : null,
    instructor: scholarBrief(s.instructor),
  };
}

/**
 * مجلسٌ في التقويم العامّ.
 *
 * رابط الانضمام لا يُعطى إلّا في نافذة البثّ (`isLiveNow`)، مطابقةً لسلوك
 * الموقع نفسه؛ ونشرُه دائمًا يجعل غرفةً معلنةً قابلةً للاقتحام قبل موعدها.
 * والتسجيل لا يُعطى هنا إطلاقًا — بابُه بوابة الطالب. و`zoomStartUrl` غير
 * مذكور أصلًا في هذا الملفّ.
 */
export function sessionPublic(s: SessionLike) {
  const base = sessionBase(s);
  return {
    ...base,
    joinUrl: base.isLiveNow ? (s.joinUrl ?? null) : null,
    passcode: base.isLiveNow ? (s.passcode ?? null) : null,
    hasRecording: Boolean(s.recordingUrl),
  };
}

/** مجلسٌ لطالبٍ مصرَّح له: رابط الانضمام والتسجيل — ولا رابط مضيف أبدًا. */
export function sessionForStudent(s: SessionLike) {
  return {
    ...sessionBase(s),
    joinUrl: s.joinUrl ?? null,
    passcode: s.passcode ?? null,
    recordingUrl: s.recordingUrl ?? null,
    recordingPasscode: s.recordingPasscode ?? null,
  };
}

// ---------------------------------------------------------------------------
// الاختبارات
// ---------------------------------------------------------------------------

export interface ChoiceLike {
  id: string;
  textAr: string;
  textEn: string;
  correct?: boolean;
}

export interface QuestionLike {
  id: string;
  kind: string;
  textAr: string;
  textEn: string;
  points: number;
  explainAr?: string | null;
  explainEn?: string | null;
  choices: ChoiceLike[];
}

/**
 * سؤالٌ **قبل التسليم**: بلا `correct` وبلا شرح.
 * الاستعلامات المغذّية لهذه الدالّة لا تقرأ الحقلين أصلًا — وهذه حراسةٌ ثانية.
 */
export function safeQuestion(q: QuestionLike) {
  return {
    id: q.id,
    kind: q.kind,
    textAr: q.textAr,
    textEn: q.textEn,
    points: q.points,
    choices: q.choices.map((c) => ({ id: c.id, textAr: c.textAr, textEn: c.textEn })),
  };
}

/** سؤالٌ **بعد التسليم**: هنا وحده يجوز كشف الصحيح والشرح ونتيجة الطالب. */
export function revealedQuestion(q: QuestionLike, o: QuestionOutcome | undefined) {
  return {
    id: q.id,
    kind: q.kind,
    textAr: q.textAr,
    textEn: q.textEn,
    points: q.points,
    explainAr: q.explainAr ?? null,
    explainEn: q.explainEn ?? null,
    choices: q.choices.map((c) => ({
      id: c.id,
      textAr: c.textAr,
      textEn: c.textEn,
      correct: Boolean(c.correct),
      selected: o?.selectedChoiceIds.includes(c.id) ?? false,
    })),
    outcome: o
      ? {
          awarded: o.awarded,
          correct: o.correct,
          manual: o.manual,
          answered: o.answered,
          textAnswer: o.textAnswer,
          selectedChoiceIds: o.selectedChoiceIds,
        }
      : null,
  };
}

// ---------------------------------------------------------------------------
// المدفوعات
// ---------------------------------------------------------------------------

export interface PaymentLike {
  id: string;
  amount: { toFixed(dp: number): string } | string | number;
  currency: string;
  status: string;
  method?: string | null;
  paidAt: Date | null;
  createdAt: Date;
  enrollment?: { id: string; course: { id: string; titleAr: string; titleEn: string } } | null;
}

/**
 * دفعة الطالب.
 *
 * المبلغ يخرج نصًّا عشريًّا مضبوطًا («١٥٠.٠٠») لا رقمًا عائمًا: إرساله `number`
 * يُدخِل خطأ الفاصلة العائمة في طرف التطبيق. ولا يخرج `note` ولا `provider`
 * ولا `providerRef` — ملاحظات إداريّة ومعرّفات بوّابة لا شأن للطالب بها.
 */
export function paymentForStudent(p: PaymentLike) {
  return {
    id: p.id,
    amount: minorToPlain(toMinor(p.amount)),
    currency: p.currency,
    status: p.status,
    method: p.method ?? null,
    paidAt: p.paidAt,
    createdAt: p.createdAt,
    enrollmentId: p.enrollment?.id ?? null,
    course: p.enrollment?.course
      ? {
          id: p.enrollment.course.id,
          titleAr: p.enrollment.course.titleAr,
          titleEn: p.enrollment.course.titleEn,
        }
      : null,
  };
}
