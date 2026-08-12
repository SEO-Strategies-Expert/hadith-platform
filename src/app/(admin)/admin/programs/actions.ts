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

function lines(v: FormDataEntryValue | null): string[] {
  return String(v || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function build(formData: FormData) {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };
  return {
    ok: true as const,
    data: {
      ...parsed.data,
      items: { ar: lines(formData.get("itemsAr")), en: lines(formData.get("itemsEn")) },
      visible: formData.get("visible") === "on",
    },
  };
}

export async function createStage(_p: string | undefined, formData: FormData) {
  await requireUser();
  const r = build(formData);
  if (!r.ok) return r.error;
  try {
    await prisma.programStage.create({ data: r.data });
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
  await prisma.programStage.update({ where: { id }, data: r.data });
  revalidatePath("/admin/programs");
  redirect("/admin/programs");
}

export async function deleteStage(id: string) {
  await requireUser();
  await prisma.course.deleteMany({ where: { stageId: id } });
  await prisma.programStage.delete({ where: { id } });
  revalidatePath("/admin/programs");
}
