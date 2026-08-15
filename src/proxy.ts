import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

// ثلاث وظائف: 1) حماية /admin لطاقم اللوحة  2) حماية بوابة الطالب
// 3) تمرير المسار/اللغة الحاليَين كترويسة داخلية ليقرأها تخطيط (site).
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const role = req.auth?.user?.role;
  const isEnglish = pathname === "/en" || pathname.startsWith("/en/");

  if (pathname.startsWith("/admin")) {
    if (!req.auth) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    // الطالب ليس من طاقم اللوحة — يُحوَّل إلى بوابته.
    if (role === "STUDENT") {
      return NextResponse.redirect(new URL("/student", req.url));
    }
  }

  // بادئة لا تطابقًا تامًّا: `/student/course/…` و`/student/lesson/…` كانت خارج
  // الحماية. الشرطة في `/student/` مقصودة — `/student-login.html` يبدأ بالبادئة
  // نفسها، ولو شملناه لدارت إعادة التوجيه على نفسها بلا نهاية.
  // هذا حارس أوّل لا وحيد: كل صفحة وserver action تُعيد التحقّق بنفسها.
  const isStudentArea =
    pathname === "/student" ||
    pathname.startsWith("/student/") ||
    pathname === "/en/student" ||
    pathname.startsWith("/en/student/");
  if (isStudentArea && !req.auth) {
    return NextResponse.redirect(
      new URL(isEnglish ? "/en/student-login.html" : "/student-login.html", req.url)
    );
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);
  requestHeaders.set("x-lang", isEnglish ? "en" : "ar");

  return NextResponse.next({ request: { headers: requestHeaders } });
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|assets/).*)"],
};
