"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { put, del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";

export async function uploadMedia(
  _prev: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  await requireUser();
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return "اختر ملفًا أولًا.";
  if (file.size > 8 * 1024 * 1024) return "الحجم الأقصى 8 ميجابايت.";

  if (!process.env.BLOB_READ_WRITE_TOKEN)
    return "تخزين الصور غير مُفعّل بعد (BLOB_READ_WRITE_TOKEN مفقود).";

  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  try {
    const blob = await put(`media/${Date.now()}-${safe}`, file, { access: "public" });
    await prisma.media.create({
      data: {
        url: blob.url,
        pathname: blob.pathname,
        filename: file.name,
        size: file.size,
        mime: file.type || null,
      },
    });
  } catch {
    return "تعذّر الرفع. حاول مجددًا.";
  }
  revalidatePath("/admin/media");
  redirect("/admin/media?uploaded=1");
}

export async function deleteMedia(id: string) {
  await requireUser();
  const m = await prisma.media.findUnique({ where: { id } });
  if (!m) return;
  try {
    await del(m.url);
  } catch {
    /* تجاهل خطأ الحذف من التخزين */
  }
  await prisma.media.delete({ where: { id } });
  revalidatePath("/admin/media");
}
