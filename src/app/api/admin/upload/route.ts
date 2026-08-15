import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { uploadFile, MEDIA_PREFIX } from "@/lib/blob";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "غير مصرَّح" }, { status: 401 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "تخزين الصور غير مُفعّل بعد (BLOB_READ_WRITE_TOKEN مفقود)." },
      { status: 500 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return NextResponse.json({ error: "اختر ملفًا." }, { status: 400 });
  }
  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "الحجم الأقصى 8 ميجابايت." }, { status: 400 });
  }

  try {
    const stored = await uploadFile(MEDIA_PREFIX, file, file.name);
    await prisma.media.create({
      data: {
        url: stored.url,
        pathname: stored.pathname,
        filename: file.name,
        size: file.size,
        mime: file.type || null,
      },
    });
    return NextResponse.json({ url: stored.url });
  } catch (e) {
    console.error("[upload] فشل الرفع", e);
    return NextResponse.json({ error: "تعذّر الرفع. حاول مجددًا." }, { status: 500 });
  }
}
