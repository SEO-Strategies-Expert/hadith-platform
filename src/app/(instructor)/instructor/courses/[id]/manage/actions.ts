"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { fromLocalInput } from "@/components/admin/datetime";
import { ownedCourseFilter, requireInstructor } from "@/lib/instructor";

function optionalText(v: unknown): string | null {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
}

function optionalInt(v: FormDataEntryValue | null): number | null {
  const n = Number(String(v ?? "").trim());
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

function touch(courseId: string, lessonId?: string) {
  revalidatePath(`/instructor/courses/${courseId}`);
  revalidatePath(`/instructor/courses/${courseId}/manage`);
  revalidatePath(`/student/course/${courseId}`);
  revalidatePath(`/en/student/course/${courseId}`);
  if (lessonId) {
    revalidatePath(`/instructor/courses/${courseId}/manage/lessons/${lessonId}`);
    revalidatePath(`/student/lesson/${lessonId}`);
    revalidatePath(`/en/student/lesson/${lessonId}`);
  }
}

async function guard(courseId: string): Promise<string | null> {
  const me = await requireInstructor();
  if (!me.scholarId) return "حسابك غير مرتبط بملف الهيئة العلمية. راجع الإدارة.";
  const course = await prisma.course.findFirst({
    where: { id: courseId, ...ownedCourseFilter(me.scholarId) },
    select: { id: true },
  });
  return course ? null : "لا يمكنك تعديل هذا المقرر.";
}

function reorder(ids: string[], id: string, dir: "up" | "down"): string[] | null {
  const i = ids.indexOf(id);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= ids.length) return null;
  const next = [...ids];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

const moduleSchema = z.object({
  titleAr: z.string().trim().min(1, "عنوان الوحدة بالعربية مطلوب"),
  titleEn: z.string().optional(),
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
      titleEn: optionalText(parsed.data.titleEn) ?? parsed.data.titleAr,
      descAr: optionalText(parsed.data.descAr),
      descEn: optionalText(parsed.data.descEn),
      order: parsed.data.order,
      visible: formData.get("visible") === "on",
    },
  };
}

export async function addInstructorModule(
  courseId: string,
  _prev: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const denied = await guard(courseId);
  if (denied) return denied;
  const titleAr = String(formData.get("titleAr") ?? "").trim();
  const titleEn = String(formData.get("titleEn") ?? "").trim() || titleAr;
  if (!titleAr) return "عنوان الوحدة بالعربية مطلوب.";
  const last = await prisma.module.findFirst({ where: { courseId }, orderBy: { order: "desc" }, select: { order: true } });
  await prisma.module.create({
    data: { courseId, titleAr, titleEn, order: (last?.order ?? 0) + 1, visible: true },
  });
  touch(courseId);
  redirect(`/instructor/courses/${courseId}/manage`);
}

export async function updateInstructorModule(
  courseId: string,
  moduleId: string,
  _prev: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const me = await requireInstructor();
  const denied = await guard(courseId);
  if (denied || !me.scholarId) return denied ?? "حسابك غير مرتبط بملف الهيئة العلمية.";
  const r = buildModule(formData);
  if (!r.ok) return r.error;
  const mod = await prisma.module.findFirst({
    where: { id: moduleId, courseId, course: ownedCourseFilter(me.scholarId) },
    select: { id: true },
  });
  if (!mod) return "لا يمكنك تعديل هذه الوحدة.";
  await prisma.module.update({ where: { id: moduleId }, data: r.data });
  touch(courseId);
  redirect(`/instructor/courses/${courseId}/manage`);
}

export async function deleteInstructorModule(courseId: string, moduleId: string) {
  const denied = await guard(courseId);
  if (denied) throw new Error(denied);
  const mod = await prisma.module.findFirst({ where: { id: moduleId, courseId }, select: { id: true } });
  if (!mod) throw new Error("الوحدة غير موجودة في هذا المقرر.");
  await prisma.module.delete({ where: { id: moduleId } });
  touch(courseId);
}

export async function moveInstructorModule(courseId: string, moduleId: string, dir: "up" | "down") {
  const denied = await guard(courseId);
  if (denied) throw new Error(denied);
  const rows = await prisma.module.findMany({
    where: { courseId },
    orderBy: [{ order: "asc" }, { titleAr: "asc" }],
    select: { id: true },
  });
  const ids = reorder(rows.map((r) => r.id), moduleId, dir);
  if (!ids) return;
  await prisma.$transaction(ids.map((id, i) => prisma.module.update({ where: { id }, data: { order: i + 1 } })));
  touch(courseId);
}

const lessonSchema = z.object({
  titleAr: z.string().trim().min(1, "عنوان الدرس بالعربية مطلوب"),
  titleEn: z.string().optional(),
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
      titleEn: optionalText(parsed.data.titleEn) ?? parsed.data.titleAr,
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

async function lessonInCourse(courseId: string, prerequisiteLessonId: string | null) {
  if (!prerequisiteLessonId) return true;
  const pre = await prisma.lesson.findFirst({
    where: { id: prerequisiteLessonId, module: { courseId } },
    select: { id: true },
  });
  return Boolean(pre);
}

export async function createInstructorLesson(
  courseId: string,
  moduleId: string,
  _prev: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const denied = await guard(courseId);
  if (denied) return denied;
  const r = buildLesson(formData);
  if (!r.ok) return r.error;
  const mod = await prisma.module.findFirst({ where: { id: moduleId, courseId }, select: { id: true } });
  if (!mod) return "الوحدة غير موجودة في هذا المقرر.";
  if (!(await lessonInCourse(courseId, r.data.prerequisiteLessonId))) return "الدرس السابق ليس من هذا المقرر.";
  await prisma.lesson.create({ data: { ...r.data, moduleId } });
  touch(courseId);
  redirect(`/instructor/courses/${courseId}/manage`);
}

export async function updateInstructorLesson(
  courseId: string,
  lessonId: string,
  _prev: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const denied = await guard(courseId);
  if (denied) return denied;
  const r = buildLesson(formData);
  if (!r.ok) return r.error;
  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, module: { courseId } },
    select: { id: true },
  });
  if (!lesson) return "لا يمكنك تعديل هذا الدرس.";
  if (r.data.prerequisiteLessonId === lessonId) return "لا يمكن أن يشترط الدرس نفسه.";
  if (!(await lessonInCourse(courseId, r.data.prerequisiteLessonId))) return "الدرس السابق ليس من هذا المقرر.";
  await prisma.lesson.update({ where: { id: lessonId }, data: r.data });
  touch(courseId, lessonId);
  redirect(`/instructor/courses/${courseId}/manage/lessons/${lessonId}?saved=1`);
}

export async function deleteInstructorLesson(courseId: string, lessonId: string) {
  const denied = await guard(courseId);
  if (denied) throw new Error(denied);
  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, module: { courseId } },
    select: { id: true },
  });
  if (!lesson) throw new Error("الدرس غير موجود في هذا المقرر.");
  await prisma.lesson.delete({ where: { id: lessonId } });
  touch(courseId, lessonId);
}

export async function moveInstructorLesson(courseId: string, moduleId: string, lessonId: string, dir: "up" | "down") {
  const denied = await guard(courseId);
  if (denied) throw new Error(denied);
  const mod = await prisma.module.findFirst({ where: { id: moduleId, courseId }, select: { id: true } });
  if (!mod) throw new Error("الوحدة غير موجودة في هذا المقرر.");
  const rows = await prisma.lesson.findMany({
    where: { moduleId },
    orderBy: [{ order: "asc" }, { titleAr: "asc" }],
    select: { id: true },
  });
  const ids = reorder(rows.map((r) => r.id), lessonId, dir);
  if (!ids) return;
  await prisma.$transaction(ids.map((id, i) => prisma.lesson.update({ where: { id }, data: { order: i + 1 } })));
  touch(courseId);
}

const attachmentSchema = z.object({
  titleAr: z.string().trim().min(1, "عنوان المرفق بالعربية مطلوب"),
  titleEn: z.string().optional(),
  url: z.string().trim().min(1, "ارفع الملف أو الصق رابطه"),
  order: z.coerce.number().int().default(0),
});

export async function createInstructorAttachment(
  courseId: string,
  lessonId: string,
  _prev: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const denied = await guard(courseId);
  if (denied) return denied;
  const parsed = attachmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return parsed.error.issues[0].message;
  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, module: { courseId } },
    select: { id: true },
  });
  if (!lesson) return "الدرس غير موجود في هذا المقرر.";
  await prisma.lessonAttachment.create({
    data: {
      lessonId,
      titleAr: parsed.data.titleAr,
      titleEn: optionalText(parsed.data.titleEn) ?? parsed.data.titleAr,
      url: parsed.data.url,
      filename: parsed.data.url.split("/").pop() || null,
      order: parsed.data.order,
    },
  });
  touch(courseId, lessonId);
  return undefined;
}

export async function deleteInstructorAttachment(courseId: string, lessonId: string, attachmentId: string) {
  const denied = await guard(courseId);
  if (denied) throw new Error(denied);
  const row = await prisma.lessonAttachment.findFirst({
    where: { id: attachmentId, lessonId, lesson: { module: { courseId } } },
    select: { id: true },
  });
  if (!row) throw new Error("المرفق غير موجود في هذا الدرس.");
  await prisma.lessonAttachment.delete({ where: { id: attachmentId } });
  touch(courseId, lessonId);
}
