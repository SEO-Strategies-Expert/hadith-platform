"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { uploadFile, MEDIA_PREFIX } from "@/lib/blob";

export async function uploadMedia(
  _prev: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  await requireUser();
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return "اختر ملفًا أولًا.";
  const supported = file.type.startsWith("image/") || file.type.startsWith("video/") || file.type.startsWith("audio/") || file.type === "application/pdf" || ["text/vtt", "application/x-subrip"].includes(file.type);
  if (!supported) return "النوع غير مدعوم. ارفع صورة أو فيديو أو صوتًا أو PDF أو ملف ترجمة VTT/SRT.";
  const max = file.type.startsWith("video/") ? 100 * 1024 * 1024 : 25 * 1024 * 1024;
  if (file.size > max) return `الحجم الأقصى ${file.type.startsWith("video/") ? 100 : 25} ميجابايت.`;

  if (!process.env.BLOB_READ_WRITE_TOKEN)
    return "تخزين الصور غير مُفعّل بعد (BLOB_READ_WRITE_TOKEN مفقود).";

  try {
    const stored = await uploadFile(MEDIA_PREFIX, file, file.name);
    const assetType = file.type.startsWith("video/") ? "video" : file.type.startsWith("audio/") ? "audio" : file.type === "application/pdf" ? "document" : file.type.includes("vtt") || file.name.endsWith(".srt") ? "caption" : "image";
    const media = await prisma.media.create({
      data: {
        url: stored.url,
        pathname: stored.pathname,
        filename: file.name,
        size: file.size,
        mime: file.type || null,
        assetType,
        private: stored.access === "private",
        processingStatus: assetType === "video" ? "queued" : "ready",
      },
    });
    if (assetType === "video") await prisma.systemJob.create({ data: { kind: "media.transcode", payload: { mediaId: media.id, pathname: stored.pathname } } });
  } catch (e) {
    console.error("[media] فشل الرفع", e);
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
    // المسار أدقّ من الرابط: مع المخزن الخاصّ يكون الرابط مسارًا من موقعنا لا من Blob.
    await del(m.pathname ?? m.url);
  } catch {
    /* تجاهل خطأ الحذف من التخزين */
  }
  await prisma.media.delete({ where: { id } });
  revalidatePath("/admin/media");
}
