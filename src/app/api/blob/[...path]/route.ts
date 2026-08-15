import { NextResponse } from "next/server";
import { signedUrlFor, MEDIA_PREFIX } from "@/lib/blob";

/**
 * يقدّم صور الموقع المرفوعة من اللوحة عندما يكون مخزن Blob خاصًّا.
 * مسموحٌ فقط بمسارات `media/` — ملفات المشاركات لا تُقدَّم من هنا إطلاقًا.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathname = path.join("/");

  if (!pathname.startsWith(MEDIA_PREFIX) || pathname.includes("..")) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const url = await signedUrlFor(pathname, 600);
    const upstream = await fetch(url);
    if (!upstream.ok || !upstream.body) {
      return new NextResponse("Not found", { status: 404 });
    }
    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "application/octet-stream",
        // المسار يتضمّن لاحقة عشوائية فلا يتغيّر محتواه — تخزينٌ طويل آمن.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
