"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import {
  validateQuestionChoices,
  QUESTION_KIND_VALUES,
  type QuizQuestionKind,
  type ChoiceDraft,
} from "@/lib/quiz";
import { CHOICE_SLOTS } from "./fields";

/**
 * إجراءات الاختبارات وأسئلتها.
 *
 * كل إجراء يبدأ بـ`requireUser()`: الـserver action نقطةُ دخولٍ شبكيّة مستقلّة،
 * وحمايةُ الصفحة التي تعرضه لا تحميه.
 *
 * وأهمّ قرار هنا: **لا يُحفظ سؤالٌ لا يمكن تصحيحه** — التحقّق في `lib/quiz.ts`
 * يمنع الحفظ برسالة عربيّة بدل أن يكتشف الطالب في منتصف الاختبار سؤالًا بلا
 * إجابة صحيحة فيرسب بلا ذنب.
 */

const listPath = "/admin/quizzes";
const questionsPath = (quizId: string) => `/admin/quizzes/${quizId}/questions`;

function optionalText(v: unknown): string | null {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
}

/** رقم موجب أو null — الفراغ والصفر يعنيان «بلا توقيت» لا «صفر دقيقة». */
function positiveIntOrNull(v: FormDataEntryValue | null): number | null {
  const n = Number(String(v ?? "").trim());
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

function intWithin(v: FormDataEntryValue | null, min: number, max: number, fallback: number): number {
  const n = Number(String(v ?? "").trim());
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

// ---------------------------------------------------------------------------
// الاختبار
// ---------------------------------------------------------------------------

const quizSchema = z.object({
  titleAr: z.string().trim().min(1, "عنوان الاختبار بالعربية مطلوب"),
  titleEn: z.string().trim().min(1, "عنوان الاختبار بالإنجليزية مطلوب"),
  descAr: z.string().optional(),
  descEn: z.string().optional(),
  courseId: z.string().optional(),
});

function buildQuiz(formData: FormData) {
  const parsed = quizSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };

  return {
    ok: true as const,
    data: {
      titleAr: parsed.data.titleAr,
      titleEn: parsed.data.titleEn,
      descAr: optionalText(parsed.data.descAr),
      descEn: optionalText(parsed.data.descEn),
      courseId: optionalText(parsed.data.courseId),
      timeLimitMin: positiveIntOrNull(formData.get("timeLimitMin")),
      passScore: intWithin(formData.get("passScore"), 0, 100, 60),
      attemptsAllowed: intWithin(formData.get("attemptsAllowed"), 0, 99, 0),
      shuffle: formData.get("shuffle") === "on",
      visible: formData.get("visible") === "on",
    },
  };
}

export async function createQuiz(
  _prev: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  await requireUser();
  const r = buildQuiz(formData);
  if (!r.ok) return r.error;

  const created = await prisma.quiz.create({ data: r.data });
  revalidatePath(listPath);
  // نأخذه مباشرةً إلى شاشة الأسئلة: اختبارٌ بلا أسئلة لا معنى له.
  redirect(questionsPath(created.id));
}

export async function updateQuiz(
  id: string,
  _prev: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  await requireUser();
  const r = buildQuiz(formData);
  if (!r.ok) return r.error;

  const before = await prisma.quiz.findUnique({ where: { id }, select: { id: true } });
  if (!before) return "الاختبار غير موجود.";

  await prisma.quiz.update({ where: { id }, data: r.data });
  revalidatePath(listPath);
  revalidatePath(questionsPath(id));
  redirect(listPath);
}

export async function deleteQuiz(id: string) {
  await requireUser();
  // الأسئلة والخيارات والمحاولات تُحذف تِبَعًا (onDelete: Cascade في المخطّط).
  await prisma.quiz.delete({ where: { id } });
  revalidatePath(listPath);
}

// ---------------------------------------------------------------------------
// الأسئلة وخياراتها
// ---------------------------------------------------------------------------

const questionSchema = z.object({
  textAr: z.string().trim().min(1, "نصّ السؤال بالعربية مطلوب"),
  textEn: z.string().trim().min(1, "نصّ السؤال بالإنجليزية مطلوب"),
  explainAr: z.string().optional(),
  explainEn: z.string().optional(),
});

function readKind(formData: FormData): QuizQuestionKind {
  const raw = String(formData.get("kind") ?? "SINGLE");
  return (QUESTION_KIND_VALUES as string[]).includes(raw) ? (raw as QuizQuestionKind) : "SINGLE";
}

/** يقرأ صفوف الخيارات من النموذج بترتيب ظهورها؛ الصفّ الفارغ يُهمَل. */
function readChoices(formData: FormData): ChoiceDraft[] {
  const rows: ChoiceDraft[] = [];
  for (let i = 0; i < CHOICE_SLOTS; i++) {
    rows.push({
      textAr: String(formData.get(`choice_${i}_ar`) ?? "").trim(),
      textEn: String(formData.get(`choice_${i}_en`) ?? "").trim(),
      correct: formData.get(`choice_${i}_correct`) === "on",
    });
  }
  return rows;
}

function buildQuestion(formData: FormData) {
  const parsed = questionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };

  const kind = readKind(formData);
  const rows = readChoices(formData);

  // التحقّق الحاسم: لا يُحفظ سؤالٌ يستحيل تصحيحه.
  const problem = validateQuestionChoices(kind, rows);
  if (problem) return { ok: false as const, error: problem };

  const filled = rows.filter((c) => c.textAr !== "" || c.textEn !== "");

  return {
    ok: true as const,
    kind,
    // السؤال القصير لا خيارات له مهما أُرسل — نُفرغها صراحةً.
    choices: kind === "SHORT" ? [] : filled,
    data: {
      kind,
      textAr: parsed.data.textAr,
      textEn: parsed.data.textEn,
      explainAr: optionalText(parsed.data.explainAr),
      explainEn: optionalText(parsed.data.explainEn),
      points: intWithin(formData.get("points"), 0, 1000, 1),
      order: intWithin(formData.get("order"), 0, 9999, 0),
    },
  };
}

export async function createQuestion(
  quizId: string,
  _prev: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  await requireUser();
  const r = buildQuestion(formData);
  if (!r.ok) return r.error;

  const quiz = await prisma.quiz.findUnique({ where: { id: quizId }, select: { id: true } });
  if (!quiz) return "الاختبار غير موجود.";

  // ترتيبٌ تلقائيّ إن تُرك صفرًا، لئلّا تتكدّس الأسئلة كلّها على الرقم نفسه.
  const order = r.data.order || (await prisma.question.count({ where: { quizId } })) + 1;

  await prisma.question.create({
    data: {
      ...r.data,
      order,
      quizId,
      choices: {
        create: r.choices.map((c, i) => ({
          textAr: c.textAr || c.textEn,
          textEn: c.textEn || c.textAr,
          correct: c.correct,
          order: i + 1,
        })),
      },
    },
  });

  revalidatePath(questionsPath(quizId));
  redirect(questionsPath(quizId));
}

export async function updateQuestion(
  quizId: string,
  questionId: string,
  _prev: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  await requireUser();
  const r = buildQuestion(formData);
  if (!r.ok) return r.error;

  const existing = await prisma.question.findUnique({
    where: { id: questionId },
    select: { quizId: true },
  });
  // انتماء السؤال للاختبار يُتحقَّق منه هنا أيضًا لا في الصفحة وحدها.
  if (!existing || existing.quizId !== quizId) return "السؤال غير موجود في هذا الاختبار.";

  // نستبدل الخيارات بالكامل في معاملة واحدة: أبسط من مطابقة صفٍّ بصفّ، ويمنع
  // بقاء خيارٍ يتيمٍ لو حُذف صفّ من النموذج.
  await prisma.$transaction([
    prisma.choice.deleteMany({ where: { questionId } }),
    prisma.question.update({
      where: { id: questionId },
      data: {
        ...r.data,
        choices: {
          create: r.choices.map((c, i) => ({
            textAr: c.textAr || c.textEn,
            textEn: c.textEn || c.textAr,
            correct: c.correct,
            order: i + 1,
          })),
        },
      },
    }),
  ]);

  revalidatePath(questionsPath(quizId));
  redirect(questionsPath(quizId));
}

export async function deleteQuestion(quizId: string, questionId: string) {
  await requireUser();
  const existing = await prisma.question.findUnique({
    where: { id: questionId },
    select: { quizId: true },
  });
  if (!existing || existing.quizId !== quizId) return;
  await prisma.question.delete({ where: { id: questionId } });
  revalidatePath(questionsPath(quizId));
}

/** تحريك سؤال خطوةً واحدة — أيسر من تحرير أرقام الترتيب صفًّا صفًّا. */
export async function moveQuestion(quizId: string, questionId: string, dir: "up" | "down") {
  await requireUser();
  const rows = await prisma.question.findMany({
    where: { quizId },
    orderBy: [{ order: "asc" }, { textAr: "asc" }],
    select: { id: true },
  });
  const ids = rows.map((r) => r.id);
  const i = ids.indexOf(questionId);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= ids.length) return;
  [ids[i], ids[j]] = [ids[j], ids[i]];

  await prisma.$transaction(
    ids.map((id, k) => prisma.question.update({ where: { id }, data: { order: k + 1 } }))
  );
  revalidatePath(questionsPath(quizId));
}
