import { getCourses } from '../api/endpoints';
import type { CourseCard } from '../api/types';
import type { StringKey } from '../i18n/strings';

/**
 * برامج الكلّية كما تقولها القاعدة، لا كما نتخيّلها.
 *
 * المراحل الثلاث في `program_stages` **هي** درجات الكلّية، وشجرة الهيدر
 * في `/api/v1/nav` تُسمّيها بأسمائها: «برنامج البكالوريوس» يشير إلى
 * `program-foundation.html`، و«برنامج الماجستير» إلى `program-higher.html`،
 * و«برنامج الدكتوراه» إلى مِرساة `#research` منها. فالمفاتيح الثلاثة
 * `foundation | advanced | research` تقابل البكالوريوس والماجستير
 * والدكتوراه على الترتيب.
 *
 * والترتيب هنا **ترتيب الدرجات لا ترتيب ورود الصفوف**: الخادم يُرتّب
 * المقرّرات بـ`order` لا المراحل، فلو أُخذ أوّلُ ظهورٍ لصار ترتيب البطاقات
 * تابعًا لترتيب المقرّرات — وهو ما لا يضمن أحد.
 */
export const STAGE_KEYS = ['foundation', 'advanced', 'research'] as const;

export type StageKey = (typeof STAGE_KEYS)[number];

/** الدرجة التي تقابل كلّ مرحلة — مفتاحُ نصٍّ في القاموس لا نصٌّ مكتوب. */
const DEGREE_KEYS: Record<StageKey, StringKey> = {
  foundation: 'degreeFoundation',
  advanced: 'degreeAdvanced',
  research: 'degreeResearch',
};

/**
 * `null` لمرحلةٍ لا نعرف مفتاحها. مرحلةٌ رابعة يضيفها المدير غدًا تُعرض
 * ببياناتها من القاعدة بلا شارة درجةٍ مخترَعة — والصمت أصدق من تخمين.
 */
export function degreeKeyOf(stageKey: string): StringKey | null {
  return DEGREE_KEYS[stageKey as StageKey] ?? null;
}

/** مرحلةٌ ومعها مقرّراتها — وحدة البطاقة في شاشة البرامج. */
export type ProgramGroup = {
  key: string;
  titleAr: string;
  titleEn: string;
  numAr: string | null;
  numEn: string | null;
  courses: CourseCard[];
  /** مجموع الدروس المعلَنة. `lessonCount` قد يكون `null` فلا يُحتسب. */
  lessons: number;
};

function emptyGroup(stage: NonNullable<CourseCard['stage']>): ProgramGroup {
  return {
    key: stage.key,
    titleAr: stage.titleAr,
    titleEn: stage.titleEn,
    numAr: stage.numAr,
    numEn: stage.numEn,
    courses: [],
    lessons: 0,
  };
}

/**
 * تصنيف الكتالوج إلى مراحلَ وما لا مرحلة له.
 *
 * بيانات المرحلة تُقرأ من `course.stage` نفسه لأنّ العقد لا يُخرج جدول
 * `program_stages` في مسارٍ مستقلّ: `stageBrief` في `src/app/api/v1/_dto.ts`
 * يُرسل `id`/`key`/`title`/`num` فحسب. فما لا يصل لا يُعرض.
 */
export function groupPrograms(courses: CourseCard[]): {
  stages: ProgramGroup[];
  /** المقرّرات بلا مرحلة — الدورات والدبلومات المستقلّة. */
  extra: CourseCard[];
} {
  const byKey = new Map<string, ProgramGroup>();
  const extra: CourseCard[] = [];

  for (const course of courses) {
    const stage = course.stage;
    if (!stage) {
      extra.push(course);
      continue;
    }
    let group = byKey.get(stage.key);
    if (!group) {
      group = emptyGroup(stage);
      byKey.set(stage.key, group);
    }
    group.courses.push(course);
    group.lessons += course.lessonCount ?? 0;
  }

  const known: ProgramGroup[] = [];
  for (const key of STAGE_KEYS) {
    const group = byKey.get(key);
    if (group) known.push(group);
  }
  // ما خرج عن الثلاثة يلحق بها ولا يسقط: المفاتيح بيدُ المدير لا بيدنا.
  const rest = [...byKey.values()].filter((g) => !(STAGE_KEYS as readonly string[]).includes(g.key));

  return { stages: [...known, ...rest], extra };
}

/* ————————————— الجلب ————————————— */

const PAGE_SIZE = 50;
/** سقفٌ يمنع الدوران إن أعاد الخادم مؤشّرًا لا ينتهي. */
const MAX_PAGES = 20;

/**
 * الكتالوج كاملًا لا صفحةً منه.
 *
 * البطاقة تقول «كم مقرّرًا في هذه الدرجة»، والعدد لا يصحّ على صفحةٍ
 * واحدة: لو زاد الكتالوج عن حدّ الصفحة لظهرت الدرجة أنقصَ ممّا هي، وهو
 * خبرٌ خاطئ لا نقصٌ في العرض. فتُستنفد الصفحات بالمؤشّر كما في العقد
 * (`nextCursor === null` يعني الانتهاء).
 */
export async function fetchAllCourses(stage?: string): Promise<CourseCard[]> {
  const all: CourseCard[] = [];
  let cursor: string | null = null;

  for (let i = 0; i < MAX_PAGES; i++) {
    const page = await getCourses({ limit: PAGE_SIZE, cursor, stage });
    all.push(...page.items);
    if (!page.nextCursor) break;
    cursor = page.nextCursor;
  }

  return all;
}
