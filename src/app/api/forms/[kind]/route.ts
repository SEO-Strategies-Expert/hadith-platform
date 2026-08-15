import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadFile, SUBMISSION_PREFIX } from "@/lib/blob";

/**
 * نقطة استقبال نماذج الموقع العام (بلا تسجيل دخول):
 * تواصل، طلب التحاق، إرسال بحث. تحفظ في قاعدة البيانات ثم تعيد الزائر
 * إلى نفس الصفحة برسالة نجاح — تعمل حتى لو كان الجافاسكربت معطَّلًا.
 */

const MAX_TEXT = 5000;
const MAX_FILE = 20 * 1024 * 1024; // 20MB لكل ملف

function text(fd: FormData, key: string, max = 300): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function backTo(req: Request, fd: FormData, query: string): NextResponse {
  const raw = text(fd, "_back", 200) || "/";
  // وجهة داخلية فقط — لا نسمح بإعادة توجيه خارجية.
  const path = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
  const url = new URL(path + query, req.url);
  return NextResponse.redirect(url, 303);
}

function invalidEmail(email: string): boolean {
  return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request, { params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  let fd: FormData;
  try {
    fd = await req.formData();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  // مصيدة الروبوتات: حقلٌ مخفيّ لا يملؤه إلا برنامج آلي.
  if (text(fd, "_hp", 50)) return backTo(req, fd, "?sent=1");

  const lang = text(fd, "_lang", 4) === "en" ? "en" : "ar";

  try {
    if (kind === "contact") {
      const name = text(fd, "name", 120);
      const email = text(fd, "email", 160);
      const message = text(fd, "message", MAX_TEXT);
      if (!name || !message || invalidEmail(email)) return backTo(req, fd, "?error=1");
      await prisma.contactMessage.create({
        data: { name, email, department: text(fd, "department", 120) || null, message, lang },
      });
      return backTo(req, fd, "?sent=1");
    }

    if (kind === "admissions") {
      const name = text(fd, "name", 120);
      const email = text(fd, "email", 160);
      if (!name || invalidEmail(email)) return backTo(req, fd, "?error=1");
      await prisma.admissionApplication.create({
        data: {
          name,
          email,
          phone: text(fd, "phone", 60) || null,
          country: text(fd, "country", 80) || null,
          program: text(fd, "program", 160) || null,
          background: text(fd, "background", MAX_TEXT) || null,
          feeOption: text(fd, "fee", 20) || null,
          lang,
        },
      });
      return backTo(req, fd, "?sent=1");
    }

    if (kind === "research") {
      const authorName = text(fd, "authorName", 120);
      const authorEmail = text(fd, "authorEmail", 160);
      const title = text(fd, "title", 300);
      if (!authorName || !title || invalidEmail(authorEmail)) return backTo(req, fd, "?error=1");

      const files: Record<string, { path: string | null; name: string | null }> = {
        doc: { path: null, name: null },
        pdf: { path: null, name: null },
      };
      for (const key of ["doc", "pdf"] as const) {
        const f = fd.get(key);
        if (f instanceof File && f.size > 0) {
          if (f.size > MAX_FILE) return backTo(req, fd, "?error=size");
          const stored = await uploadFile(SUBMISSION_PREFIX, f, f.name);
          files[key] = { path: stored.pathname, name: f.name.slice(0, 160) };
        }
      }

      await prisma.researchSubmission.create({
        data: {
          authorName,
          authorEmail,
          title,
          paperType: text(fd, "paperType", 120) || null,
          field: text(fd, "field", 120) || null,
          abstract: text(fd, "abstract", MAX_TEXT) || null,
          docPath: files.doc.path,
          docName: files.doc.name,
          pdfPath: files.pdf.path,
          pdfName: files.pdf.name,
          lang,
        },
      });
      return backTo(req, fd, "?sent=1");
    }

    return NextResponse.json({ error: "نموذج غير معروف" }, { status: 404 });
  } catch (e) {
    console.error("[forms] فشل حفظ نموذج", kind, e);
    return backTo(req, fd, "?error=1");
  }
}
