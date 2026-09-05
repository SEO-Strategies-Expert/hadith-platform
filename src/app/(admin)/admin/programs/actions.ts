"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";

const schema = z.object({
  key: z.string().min(2, "المفتاح مطلوب"),
  numAr: z.string().optional(),
  numEn: z.string().optional(),
  titleAr: z.string().min(2, "العنوان بالعربية مطلوب"),
  titleEn: z.string().min(2, "العنوان بالإنجليزية مطلوب"),
  metaAr: z.string().optional(),
  metaEn: z.string().optional(),
  descAr: z.string().optional(),
  descEn: z.string().optional(),
  icon: z.string().optional(),
  moreHref: z.string().optional(),
  order: z.coerce.number().int().default(0),
});

function build(formData: FormData) {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };
  return {
    ok: true as const,
    data: {
      ...parsed.data,
      visible: formData.get("visible") === "on",
    },
  };
}

export async function createStage(_p: string | undefined, formData: FormData) {
  await requireUser();
  const r = build(formData);
  if (!r.ok) return r.error;
  const courseIds = formData.getAll("courseIds").map(String).filter(Boolean);
  try {
    const selectedCourses = await prisma.course.findMany({
      where: { id: { in: courseIds } },
      select: { id: true, titleAr: true, titleEn: true },
    });
    await prisma.$transaction(async (tx) => {
      const stage = await tx.programStage.create({
        data: {
          ...r.data,
          items: {
            ar: selectedCourses.map((course) => course.titleAr),
            en: selectedCourses.map((course) => course.titleEn),
          },
        },
      });
      if (selectedCourses.length) {
        await tx.course.updateMany({
          where: { id: { in: selectedCourses.map((course) => course.id) } },
          data: { stageId: stage.id },
        });
      }
    });
  } catch {
    return "تعذّر الحفظ — قد يكون المفتاح مكرّرًا.";
  }
  revalidatePath("/admin/programs");
  redirect("/admin/programs");
}

export async function updateStage(id: string, _p: string | undefined, formData: FormData) {
  await requireUser();
  const r = build(formData);
  if (!r.ok) return r.error;
  const courseIds = formData.getAll("courseIds").map(String).filter(Boolean);
  const selectedCourses = await prisma.course.findMany({
    where: { id: { in: courseIds } },
    select: { id: true, titleAr: true, titleEn: true },
  });
  await prisma.$transaction([
    prisma.course.updateMany({ where: { stageId: id }, data: { stageId: null } }),
    prisma.course.updateMany({
      where: { id: { in: selectedCourses.map((course) => course.id) } },
      data: { stageId: id },
    }),
    prisma.programStage.update({
      where: { id },
      data: {
        ...r.data,
        items: {
          ar: selectedCourses.map((course) => course.titleAr),
          en: selectedCourses.map((course) => course.titleEn),
        },
      },
    }),
  ]);
  revalidatePath("/admin/programs");
  redirect("/admin/programs");
}

export async function deleteStage(id: string) {
  await requireUser();
  await prisma.$transaction([
    prisma.course.updateMany({ where: { stageId: id }, data: { stageId: null } }),
    prisma.programStage.delete({ where: { id } }),
  ]);
  revalidatePath("/admin/programs");
}
