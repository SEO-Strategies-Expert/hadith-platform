/**
 * نواة الاختبارات: التصحيح الآلي، والتحقّق من سلامة الأسئلة، وحساب المهلة.
 *
 * **هذا الملفّ نقيّ عمدًا: بلا استيراد واحد** — لا Prisma ولا Next ولا أنواع
 * مولَّدة. السبب أنّ التصحيح هو الموضع الذي يقع فيه الظلم إن أخطأ، فأردناه
 * قابلًا للاختبار وحده بلا قاعدة بيانات ولا خادم. كل من يستدعيه (اللوحة،
 * بوابة الطالب) يمرّر بيانات صافيةً ويستقبل نتيجةً صافية.
 *
 * وقاعدة أخرى محكومة هنا: **الدرجة تُحسب على الخادم فقط**، ولا تُشتقّ أبدًا من
 * شيء أرسله المتصفّح غير اختيارات الطالب نفسها.
 */

// ---------------------------------------------------------------------------
// الأنواع
// ---------------------------------------------------------------------------

/** أنواع الأسئلة — مطابقة لـ`QuestionKind` في المخطّط، مكتوبةً هنا نصًّا لإبقاء الملفّ بلا استيراد. */
export type QuizQuestionKind = "SINGLE" | "MULTI" | "TRUEFALSE" | "SHORT";

export const QUESTION_KIND_VALUES: QuizQuestionKind[] = ["SINGLE", "MULTI", "TRUEFALSE", "SHORT"];

/** سؤال بصورته اللازمة للتصحيح فقط — لا نصوص ولا شروح. */
export interface GradableQuestion {
  id: string;
  kind: QuizQuestionKind;
  points: number;
  /** معرّفات الخيارات الصحيحة. فارغة دائمًا في `SHORT`. */
  correctChoiceIds: string[];
}

/** إجابات الطالب: معرّف السؤال ← خيارات مختارة (اختياري/متعدّد) أو نصّ (قصير). */
export type QuizAnswers = Record<string, string[] | string | null | undefined>;

export interface QuestionOutcome {
  questionId: string;
  kind: QuizQuestionKind;
  points: number;
  /** ما نالَه الطالب فعلًا من نقاط هذا السؤال (صفر في المؤجَّل للتصحيح اليدوي). */
  awarded: number;
  /** null يعني «لم يُصحَّح بعد» — لا «خطأ». تمييزها ضروريّ لئلّا يُظلم الطالب. */
  correct: boolean | null;
  /** هل يحتاج تصحيحًا بشريًّا؟ (أسئلة الإجابة القصيرة) */
  manual: boolean;
  selectedChoiceIds: string[];
  textAnswer: string | null;
  answered: boolean;
}

export interface QuizGrade {
  /** مجموع نقاط الأسئلة التي صُحّحت آليًّا. */
  autoPoints: number;
  /** ما ناله الطالب من تلك النقاط. */
  earnedPoints: number;
  /** نقاط الأسئلة المؤجَّلة للتصحيح اليدوي — خارج حساب النسبة عمدًا. */
  manualPoints: number;
  /** النسبة المئويّة من النقاط الآليّة، أو null إن لم يوجد سؤال آليّ أصلًا. */
  score: number | null;
  /** النجاح مقابل `passScore`، أو null إن تعذّر حساب نسبة. */
  passed: boolean | null;
  /** فيه سؤال إجابةٍ قصيرة ينتظر تصحيح المعلّم. */
  needsManualReview: boolean;
  outcomes: QuestionOutcome[];
}

// ---------------------------------------------------------------------------
// التصحيح الآلي
// ---------------------------------------------------------------------------

/** يوحّد إجابةً واردة من `FormData` أو من JSON مخزَّن إلى قائمة معرّفات. */
export function toChoiceIds(value: string[] | string | null | undefined): string[] {
  if (value == null) return [];
  const arr = Array.isArray(value) ? value : [value];
  const out: string[] = [];
  for (const v of arr) {
    const s = String(v).trim();
    // نزيل التكرار لأنّ متصفّحًا مُتلاعَبًا به قد يرسل الخيار نفسه مرارًا
    // فيبدو «تطابقًا تامًّا» وهو ليس كذلك.
    if (s && !out.includes(s)) out.push(s);
  }
  return out;
}

/** يوحّد إجابة نصّيّة (سؤال قصير). */
export function toTextAnswer(value: string[] | string | null | undefined): string | null {
  if (value == null) return null;
  const s = (Array.isArray(value) ? (value[0] ?? "") : String(value)).trim();
  return s === "" ? null : s;
}

/** تطابق تامّ بين مجموعتين من المعرّفات بصرف النظر عن الترتيب. */
export function sameChoiceSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((v, i) => v === sortedB[i]);
}

/**
 * يصحّح محاولةً كاملة.
 *
 * قواعد الاحتساب:
 *  • `SINGLE` و`TRUEFALSE` و`MULTI` — **تطابق تامّ للمجموعة**؛ فالإجابة الجزئيّة
 *    في المتعدّد لا تُحتسب، وإلّا لصار التخمين بتعليم كل الخيارات مربحًا.
 *  • `SHORT` — لا تُصحَّح آليًّا ولا تُحتسب صفرًا؛ تُستثنى من مقام النسبة وتُعلَّم
 *    `manual`. احتسابها صفرًا ظلمٌ للطالب قبل أن يقرأها معلّم.
 *  • النسبة = (المكتسب ÷ نقاط الأسئلة الآليّة) × ١٠٠ مقرَّبةً، والنجاح `>= passScore`
 *    (الحدّ نفسه نجاحٌ لا رسوب).
 */
export function gradeQuiz(
  questions: GradableQuestion[],
  answers: QuizAnswers,
  passScore: number
): QuizGrade {
  let autoPoints = 0;
  let earnedPoints = 0;
  let manualPoints = 0;
  let needsManualReview = false;

  const outcomes: QuestionOutcome[] = questions.map((q) => {
    // نقطةٌ سالبة أو كسريّة تفسد الحساب — نثبّتها عند حدّ معقول.
    const points = Number.isFinite(q.points) ? Math.max(0, Math.round(q.points)) : 0;
    const raw = answers[q.id];

    if (q.kind === "SHORT") {
      const text = toTextAnswer(raw);
      manualPoints += points;
      needsManualReview = true;
      return {
        questionId: q.id,
        kind: q.kind,
        points,
        awarded: 0,
        correct: null,
        manual: true,
        selectedChoiceIds: [],
        textAnswer: text,
        answered: text !== null,
      };
    }

    const selected = toChoiceIds(raw);
    const correctIds = toChoiceIds(q.correctChoiceIds);
    autoPoints += points;

    // سؤال بلا إجابة صحيحة مُعرَّفة لا يُصحَّح بمجرّد أنّ الطالب ترك الفراغ؛
    // نمنع الحفظ من الأصل في اللوحة، وهنا نحتاط فنعتبره خطأً لا نجاحًا مجّانيًّا.
    const isCorrect = correctIds.length > 0 && sameChoiceSet(selected, correctIds);
    if (isCorrect) earnedPoints += points;

    return {
      questionId: q.id,
      kind: q.kind,
      points,
      awarded: isCorrect ? points : 0,
      correct: isCorrect,
      manual: false,
      selectedChoiceIds: selected,
      textAnswer: null,
      answered: selected.length > 0,
    };
  });

  const score = autoPoints > 0 ? Math.round((earnedPoints / autoPoints) * 100) : null;
  const passed = score === null ? null : score >= passScore;

  return { autoPoints, earnedPoints, manualPoints, score, passed, needsManualReview, outcomes };
}

// ---------------------------------------------------------------------------
// التحقّق من سلامة السؤال قبل الحفظ
// ---------------------------------------------------------------------------

export interface ChoiceDraft {
  textAr: string;
  textEn: string;
  correct: boolean;
}

/**
 * يتحقّق أنّ خيارات السؤال تجعله قابلًا للإجابة والتصحيح.
 * يعيد رسالةً عربيّة عند الخطأ أو `null` عند السلامة — نمنع الحفظ بدل أن نترك
 * في المقرّر اختبارًا لا يمكن اجتيازه أصلًا.
 */
export function validateQuestionChoices(
  kind: QuizQuestionKind,
  choices: ChoiceDraft[]
): string | null {
  const filled = choices.filter((c) => c.textAr.trim() !== "" || c.textEn.trim() !== "");
  const correctCount = filled.filter((c) => c.correct).length;

  if (kind === "SHORT") {
    return filled.length > 0
      ? "سؤال الإجابة القصيرة لا يقبل خيارات — امسح الخيارات أو غيّر نوع السؤال."
      : null;
  }

  if (kind === "TRUEFALSE") {
    if (filled.length !== 2) return "سؤال صواب/خطأ يحتاج خيارين اثنين بالضبط (صواب وخطأ).";
    if (correctCount !== 1) return "علّم خيارًا واحدًا صحيحًا بالضبط في سؤال صواب/خطأ.";
    return null;
  }

  if (filled.length < 2) return "السؤال يحتاج خيارين على الأقلّ.";

  if (kind === "SINGLE") {
    if (correctCount === 0) return "سؤال الاختيار الواحد يحتاج خيارًا صحيحًا — علّم الإجابة الصحيحة.";
    if (correctCount > 1) return "سؤال الاختيار الواحد لا يقبل أكثر من إجابة صحيحة واحدة.";
    return null;
  }

  // MULTI
  if (correctCount < 1) return "سؤال الاختيار المتعدّد يحتاج إجابةً صحيحة واحدة على الأقلّ.";
  return null;
}

// ---------------------------------------------------------------------------
// المهلة الزمنيّة — تُحسب من الخادم لا من مؤقّت المتصفّح
// ---------------------------------------------------------------------------

/** لحظة انتهاء المحاولة، أو null إن كان الاختبار بلا توقيت. */
export function attemptDeadline(startedAt: Date, timeLimitMin: number | null | undefined): Date | null {
  if (!timeLimitMin || timeLimitMin <= 0) return null;
  return new Date(startedAt.getTime() + timeLimitMin * 60_000);
}

/**
 * مهلة تسامح لتأخّر الشبكة بين ضغط الطالب «تسليم» ووصول الطلب.
 * بدونها يُظلم من سلّم في الثانية الأخيرة على اتّصال بطيء.
 */
export const SUBMIT_GRACE_MS = 60_000;

export function isAttemptExpired(
  startedAt: Date,
  timeLimitMin: number | null | undefined,
  now: Date = new Date()
): boolean {
  const deadline = attemptDeadline(startedAt, timeLimitMin);
  return deadline !== null && now.getTime() > deadline.getTime();
}

/** هل وصل التسليم بعد المهلة + التسامح؟ عندها تُهمَل الإجابات. */
export function isSubmitTooLate(
  startedAt: Date,
  timeLimitMin: number | null | undefined,
  now: Date = new Date()
): boolean {
  const deadline = attemptDeadline(startedAt, timeLimitMin);
  return deadline !== null && now.getTime() > deadline.getTime() + SUBMIT_GRACE_MS;
}

// ---------------------------------------------------------------------------
// خلط ترتيب الأسئلة
// ---------------------------------------------------------------------------

/** تجزئة نصّيّة بسيطة (FNV-1a) — لتوليد بذرة ثابتة من معرّف المحاولة. */
function hashSeed(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * خلط ثابت بالبذرة: نفس المحاولة تُعطي نفس الترتيب في كل تصيير.
 * لماذا لا `Math.random()`؟ لأنّ الصفحة تُصيَّر أكثر من مرّة (إعادة تحميل،
 * رسالة خطأ)، فترتيبٌ عشوائيّ في كل مرّة يربك الطالب ويُفسد مقارنة إجاباته.
 */
export function shuffleWithSeed<T>(items: T[], seed: string): T[] {
  const out = [...items];
  let state = hashSeed(seed) || 1;
  const next = () => {
    // مولّد خطّي بسيط — يكفي للخلط البصري، وليس أمانًا تشفيريًّا.
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ---------------------------------------------------------------------------
// أدوات عرض مشتركة
// ---------------------------------------------------------------------------

/** اسم حقل السؤال في النموذج — موحَّد بين التصيير والتسليم. */
export function answerFieldName(questionId: string): string {
  return `q_${questionId}`;
}

/** يستخرج معرّف السؤال من اسم الحقل، أو null إن لم يكن حقل إجابة. */
export function questionIdFromField(field: string): string | null {
  return field.startsWith("q_") ? field.slice(2) : null;
}

/** درجة الواجب مقيَّدةً بين صفر والحدّ الأقصى — لا نقبل ما يتجاوز `maxScore`. */
export function clampScore(value: number, maxScore: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(Math.round(maxScore), Math.round(value)));
}
