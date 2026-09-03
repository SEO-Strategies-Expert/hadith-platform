"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { fromLocalInput } from "@/components/admin/datetime";

/**
 * إجراءات بنية المقرّر: الوحدات والدروس والمرفقات.
 * كل إجراء هنا يبدأ بـ`requireUser()` — حماية الصفحة وحدها لا تكفي لأنّ
 * إجراءات الخادم نقاط دخول مستقلّة يمكن استدعاؤها بطلب مباشر.
 */

const contentPath = (courseId: string) => `/admin/courses/${courseId}/content`;

/** رقم اختياري: الفراغ والصفر يعنيان «غير محدَّد» لا القيمة صفرًا. */
function optionalInt(v: FormDataEntryValue | null): number | null {
  const n = Number(String(v ?? "").trim());
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

function optionalText(v: unknown): string | null {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
}

// ---------------------------------------------------------------------------
// الوحدات
// ---------------------------------------------------------------------------

const moduleSchema = z.object({
  titleAr: z.string().trim().min(1, "عنوان الوحدة بالعربية مطلوب"),
  titleEn: z.string().trim().min(1, "عنوان الوحدة بالإنجليزية مطلوب"),
  descAr: z.string().optional(),
  descEn: z.string().optional(),
  order: z.coerce.number().int().default(0),
});

function buildModule(formData: FormData) {
  const parsed = moduleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };
  return {
    ok: true as const,
    data: {
      titleAr: parsed.data.titleAr,
      titleEn: parsed.data.titleEn,
      descAr: optionalText(parsed.data.descAr),
      descEn: optionalText(parsed.data.descEn),
      order: parsed.data.order,
      visible: formData.get("visible") === "on",
    },
  };
}

export async function createModule(
  courseId: string,
  _prev: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  await requireUser();
  const r = buildModule(formData);
  if (!r.ok) return r.error;
  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true } });
  if (!course) return "المقرّر غير موجود.";
  await prisma.module.create({ data: { ...r.data, courseId } });
  revalidatePath(contentPath(courseId));
  redirect(contentPath(courseId));
}

export async function updateModule(
  courseId: string,
  moduleId: string,
  _prev: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  await requireUser();
  const r = buildModule(formData);
  if (!r.ok) return r.error;
  await prisma.module.update({ where: { id: moduleId }, data: r.data });
  revalidatePath(contentPath(courseId));
  redirect(contentPath(courseId));
}

export async function deleteModule(courseId: string, moduleId: string) {
  await requireUser();
  // الدروس والمرفقات تُحذف تِبَعًا (onDelete: Cascade في المخطّط).
  await prisma.module.delete({ where: { id: moduleId } });
  revalidatePath(contentPath(courseId));
}

/** تحريك وحدة خطوةً واحدة — أسهل من تحرير رقم الترتيب يدويًّا لكل صفّ. */
export async function moveModule(courseId: string, moduleId: string, dir: "up" | "down") {
  await requireUser();
  const rows = await prisma.module.findMany({
    where: { courseId },
    orderBy: [{ order: "asc" }, { titleAr: "asc" }],
    select: { id: true },
  });
  const ids = reorder(rows.map((r) => r.id), moduleId, dir);
  if (!ids) return;
  await prisma.$transaction(
    ids.map((id, i) => prisma.module.update({ where: { id }, data: { order: i + 1 } }))
  );
  revalidatePath(contentPath(courseId));
}

/** يبدّل عنصرًا بجاره ويعيد الترتيب الجديد، أو null إن تعذّر التحريك. */
function reorder(ids: string[], id: string, dir: "up" | "down"): string[] | null {
  const i = ids.indexOf(id);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= ids.length) return null;
  const next = [...ids];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

// ---------------------------------------------------------------------------
// الدروس
// ---------------------------------------------------------------------------

const lessonSchema = z.object({
  titleAr: z.string().trim().min(1, "عنوان الدرس بالعربية مطلوب"),
  titleEn: z.string().trim().min(1, "عنوان الدرس بالإنجليزية مطلوب"),
  kind: z.enum(["VIDEO", "PDF", "TEXT", "LIVE", "QUIZ"]).default("VIDEO"),
  videoUrl: z.string().optional(),
  bodyAr: z.string().optional(),
  bodyEn: z.string().optional(),
  order: z.coerce.number().int().default(0),
});

function buildLesson(formData: FormData) {
  const parsed = lessonSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };
  return {
    ok: true as const,
    data: {
      titleAr: parsed.data.titleAr,
      titleEn: parsed.data.titleEn,
      kind: parsed.data.kind,
      videoUrl: optionalText(parsed.data.videoUrl),
      bodyAr: optionalText(parsed.data.bodyAr),
      bodyEn: optionalText(parsed.data.bodyEn),
      transcriptAr: optionalText(formData.get("transcriptAr")),
      transcriptEn: optionalText(formData.get("transcriptEn")),
      unlockAt: fromLocalInput(String(formData.get("unlockAt") ?? "")),
      dripDays: Math.max(0, Number(formData.get("dripDays") ?? 0) || 0),
      prerequisiteLessonId: optionalText(formData.get("prerequisiteLessonId")),
      thumbnailUrl: optionalText(formData.get("thumbnailUrl")),
      downloadable: formData.get("downloadable") === "on",
      durationMin: optionalInt(formData.get("durationMin")),
      order: parsed.data.order,
      freePreview: formData.get("freePreview") === "on",
      visible: formData.get("visible") === "on",
    },
  };
}

export async function createLesson(
  courseId: string,
  moduleId: string,
  _prev: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  await requireUser();
  const r = buildLesson(formData);
  if (!r.ok) return r.error;
  const mod = await prisma.module.findUnique({ where: { id: moduleId }, select: { courseId: true } });
  if (!mod || mod.courseId !== courseId) return "الوحدة غير موجودة في هذا المقرّر.";
  await prisma.lesson.create({ data: { ...r.data, moduleId } });
  revalidatePath(contentPath(courseId));
  redirect(contentPath(courseId));
}

export async function updateLesson(
  courseId: string,
  lessonId: string,
  _prev: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  await requireUser();
  const r = buildLesson(formData);
  if (!r.ok) return r.error;
  await prisma.lesson.update({ where: { id: lessonId }, data: r.data });
  revalidatePath(contentPath(courseId));
  redirect(contentPath(courseId));
}

export async function deleteLesson(courseId: string, lessonId: string) {
  await requireUser();
  await prisma.lesson.delete({ where: { id: lessonId } });
  revalidatePath(contentPath(courseId));
}

export async function moveLesson(courseId: string, moduleId: string, lessonId: string, dir: "up" | "down") {
  await requireUser();
  const rows = await prisma.lesson.findMany({
    where: { moduleId },
    orderBy: [{ order: "asc" }, { titleAr: "asc" }],
    select: { id: true },
  });
  const ids = reorder(rows.map((r) => r.id), lessonId, dir);
  if (!ids) return;
  await prisma.$transaction(
    ids.map((id, i) => prisma.lesson.update({ where: { id }, data: { order: i + 1 } }))
  );
  revalidatePath(contentPath(courseId));
}

// ---------------------------------------------------------------------------
// مرفقات الدرس
// ---------------------------------------------------------------------------

const attachmentSchema = z.object({
  titleAr: z.string().trim().min(1, "عنوان المرفق بالعربية مطلوب"),
  titleEn: z.string().optional(),
  url: z.string().trim().min(1, "رابط المرفق مطلوب"),
  order: z.coerce.number().int().default(0),
});

export async function createAttachment(
  courseId: string,
  lessonId: string,
  _prev: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  await requireUser();
  const parsed = attachmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return parsed.error.issues[0].message;
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, select: { id: true } });
  if (!lesson) return "الدرس غير موجود.";
  await prisma.lessonAttachment.create({
    data: {
      lessonId,
      titleAr: parsed.data.titleAr,
      // العنوان الإنجليزي مطلوب في المخطّط؛ نسقط للعربي بدل رفض الحفظ.
      titleEn: optionalText(parsed.data.titleEn) ?? parsed.data.titleAr,
      url: parsed.data.url,
      filename: parsed.data.url.split("/").pop() || null,
      order: parsed.data.order,
    },
  });
  revalidatePath(`/admin/courses/${courseId}/content/lessons/${lessonId}`);
  return undefined;
}

export async function deleteAttachment(courseId: string, lessonId: string, attachmentId: string) {
  await requireUser();
  await prisma.lessonAttachment.delete({ where: { id: attachmentId } });
  revalidatePath(`/admin/courses/${courseId}/content/lessons/${lessonId}`);
}
