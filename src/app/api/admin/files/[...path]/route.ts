import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { signedUrlFor } from "@/lib/blob";

/** تنزيل ملفات المشاركات (أبحاث مُرسَلة) — للمسجَّلين في اللوحة فقط. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  // طاقم اللوحة فقط — حساب الطالب مسجَّلٌ أيضًا ولا يجوز أن يصل لملفات المشاركات.
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "ADMIN" && role !== "EDITOR") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { path } = await params;
  const pathname = path.join("/");
  if (pathname.includes("..")) return new NextResponse("Not found", { status: 404 });

  try {
    const url = await signedUrlFor(pathname, 300);
    return NextResponse.redirect(url, 307);
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
