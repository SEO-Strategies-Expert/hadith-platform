import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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
    return NextResponse.json({ url: blob.url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("private store")) {
      return NextResponse.json(
        {
          error:
            "مخزن Blob على Vercel مضبوط كخاصّ (Private) فلا يمكن عرض الصور منه للزوّار. " +
            "من لوحة Vercel: Storage → مخزن Blob → أنشئ مخزنًا جديدًا بوصول عام (Public)، أو فعّل الوصول العام إن توفّر، وحدِّث BLOB_READ_WRITE_TOKEN.",
        },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: "تعذّر الرفع. حاول مجددًا." }, { status: 500 });
  }
}
