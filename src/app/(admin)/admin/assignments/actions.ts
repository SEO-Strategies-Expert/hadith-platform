"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { clampScore } from "@/lib/quiz";
import { fromLocalInput } from "@/components/admin/datetime";

/**
 * إجراءات الواجبات وتصحيحها.
 * كلّها تبدأ بـ`requireUser()` — الـserver action نقطة دخولٍ شبكيّة مستقلّة.
 */

const listPath = "/admin/assignments";
const submissionsPath = (id: string) => `/admin/assignments/${id}/submissions`;

function optionalText(v: unknown): string | null {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
}

function intWithin(v: FormDataEntryValue | null, min: number, max: number, fallback: number): number {
  const n = Number(String(v ?? "").trim());
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

// ---------------------------------------------------------------------------
// الواجب
// ---------------------------------------------------------------------------

const assignmentSchema = z.object({
  titleAr: z.string().trim().min(1, "عنوان الواجب بالعربية مطلوب"),
  titleEn: z.string().trim().min(1, "عنوان الواجب بالإنجليزية مطلوب"),
  descAr: z.string().optional(),
  descEn: z.string().optional(),
  courseId: z.string().trim().min(1, "اختر المقرّر الذي ينتمي إليه الواجب"),
});

function buildAssignment(formData: FormData) {
  const parsed = assignmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };

  let rubric = null;
  try {
    const rawRubric = String(formData.get("rubric") ?? "").trim();
    rubric = rawRubric ? JSON.parse(rawRubric) : null;
  } catch {
    return { ok: false as const, error: "صيغة سُلّم التقييم JSON غير صحيحة." };
  }
  return {
    ok: true as const,
    data: {
      titleAr: parsed.data.titleAr,
      titleEn: parsed.data.titleEn,
      descAr: optionalText(parsed.data.descAr),
      descEn: optionalText(parsed.data.descEn),
      courseId: parsed.data.courseId,
      // الفراغ يعني «بلا موعد نهائي» لا تاريخًا صفريًّا.
      dueAt: fromLocalInput(String(formData.get("dueAt") ?? "")),
      maxScore: intWithin(formData.get("maxScore"), 1, 10000, 100),
      rubric,
      gradingPeriod: optionalText(formData.get("gradingPeriod")),
      allowLate: formData.get("allowLate") === "on",
      order: intWithin(formData.get("order"), 0, 9999, 0),
      visible: formData.get("visible") === "on",
    },
  };
}

export async function createAssignment(
  _prev: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  await requireUser();
  const r = buildAssignment(formData);
  if (!r.ok) return r.error;

  const course = await prisma.course.findUnique({
    where: { id: r.data.courseId },
    select: { id: true },
  });
  if (!course) return "المقرّر المختار غير موجود.";

  await prisma.assignment.create({ data: r.data });
  revalidatePath(listPath);
  redirect(listPath);
}

export async function updateAssignment(
  id: string,
  _prev: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  await requireUser();
  const r = buildAssignment(formData);
  if (!r.ok) return r.error;

  const before = await prisma.assignment.findUnique({ where: { id }, select: { id: true } });
  if (!before) return "الواجب غير موجود.";

  await prisma.assignment.update({ where: { id }, data: r.data });
  revalidatePath(listPath);
  revalidatePath(submissionsPath(id));
  redirect(listPath);
}

export async function deleteAssignment(id: string) {
  await requireUser();
  // تسليمات الطلاب تُحذف تِبَعًا (onDelete: Cascade في المخطّط).
  await prisma.assignment.delete({ where: { id } });
  revalidatePath(listPath);
}

// ---------------------------------------------------------------------------
// التصحيح
// ---------------------------------------------------------------------------

/**
 * يضع درجة التسليم وملاحظته.
 *
 * الدرجة تُقيَّد بـ`maxScore` **المقروء من قاعدة البيانات** لا من النموذج:
 * حقلٌ مخفيّ في الصفحة يمكن تزويره، أمّا سجلّ الواجب فلا.
 */
export async function gradeSubmission(
  assignmentId: string,
  submissionId: string,
  _prev: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const admin = await requireUser();

  const submission = await prisma.assignmentSubmission.findUnique({
    where: { id: submissionId },
    select: { assignmentId: true, assignment: { select: { maxScore: true } } },
  });
  if (!submission || submission.assignmentId !== assignmentId) {
    return "التسليم غير موجود في هذا الواجب.";
  }

  const rawState = String(formData.get("state") ?? "GRADED");
  const state = rawState === "RETURNED" ? "RETURNED" : "GRADED";
  const feedback = optionalText(formData.get("feedback"));

  const rawScore = String(formData.get("score") ?? "").trim();
  if (state === "GRADED" && rawScore === "") return "أدخل الدرجة قبل اعتماد التصحيح.";

  const parsedScore = Number(rawScore);
  if (rawScore !== "" && !Number.isFinite(parsedScore)) return "الدرجة يجب أن تكون رقمًا.";
  if (parsedScore > submission.assignment.maxScore) {
    return `الدرجة لا تتجاوز الدرجة القصوى للواجب (${submission.assignment.maxScore}).`;
  }
  if (parsedScore < 0) return "الدرجة لا تكون سالبة.";

  const score = rawScore === "" ? null : clampScore(parsedScore, submission.assignment.maxScore);

  await prisma.assignmentSubmission.update({
    where: { id: submissionId },
    data: {
      score,
      feedback,
      state,
      // نختم المصحِّح ووقته فقط عند الاعتماد النهائي.
      gradedById: state === "GRADED" ? admin.id : null,
      gradedAt: state === "GRADED" ? new Date() : null,
    },
  });

  revalidatePath(submissionsPath(assignmentId));
  // بوابة الطالب تعرض الدرجة والملاحظة — نُبطل ذاكرتها في اللغتين.
  for (const prefix of ["/student", "/en/student"]) {
    revalidatePath(`${prefix}/assignment/${assignmentId}`);
  }
  return undefined;
}
