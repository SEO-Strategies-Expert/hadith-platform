"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";

const schema = z.object({
  nameAr: z.string().min(2, "الاسم بالعربية مطلوب"),
  nameEn: z.string().min(2, "الاسم بالإنجليزية مطلوب"),
  rankAr: z.string().optional(),
  rankEn: z.string().optional(),
  specAr: z.string().optional(),
  specEn: z.string().optional(),
  bioAr: z.string().optional(),
  bioEn: z.string().optional(),
  photoUrl: z.string().optional(),
  order: z.coerce.number().int().default(0),
});

function parse(formData: FormData) {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { ok: false as const, error: parsed.error.issues[0].message };
  return {
    ok: true as const,
    data: {
      ...parsed.data,
      isCouncil: formData.get("isCouncil") === "on",
      isCouncilHead: formData.get("isCouncilHead") === "on",
      visible: formData.get("visible") === "on",
    },
  };
}

export async function createScholar(_p: string | undefined, formData: FormData) {
  await requireUser();
  const r = parse(formData);
  if (!r.ok) return r.error;
  await prisma.scholar.create({ data: r.data });
  revalidatePath("/admin/faculty");
  redirect("/admin/faculty");
}

export async function updateScholar(
  id: string,
  _p: string | undefined,
  formData: FormData
) {
  await requireUser();
  const r = parse(formData);
  if (!r.ok) return r.error;
  await prisma.scholar.update({ where: { id }, data: r.data });
  revalidatePath("/admin/faculty");
  redirect("/admin/faculty");
}

export async function deleteScholar(id: string) {
  await requireUser();
  await prisma.scholar.delete({ where: { id } });
  revalidatePath("/admin/faculty");
}
