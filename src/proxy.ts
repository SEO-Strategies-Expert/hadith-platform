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
    // وكذلك عضو هيئة التدريس: صلاحيّاته في لوحته وحدها.
    if (role === "INSTRUCTOR") {
      return NextResponse.redirect(new URL("/instructor", req.url));
    }
  }

  // لوحة الأكاديميين: للمحاضر، ويدخلها المدير للتفقّد. غيرهما يُصرَف عنها.
  if (pathname === "/instructor" || pathname.startsWith("/instructor/")) {
    if (!req.auth) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (role !== "INSTRUCTOR" && role !== "ADMIN") {
      return NextResponse.redirect(new URL(role === "STUDENT" ? "/student" : "/admin", req.url));
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
  // الصفحة مفتوحة داخل تطبيق الجوال: يخفي التخطيطُ إطارَ الموقع (هيدر وشريط
  // وفوتر) فلا يجتمع هيدران. حقنُ CSS في الـWebView كان هشًّا ولا يُنفَّذ دائمًا،
  // فالقرار هنا على الخادم: حتميّ وقابل للفحص بفتح `?app=1` في أي متصفّح.
  if (req.nextUrl.searchParams.get("app") === "1") {
    requestHeaders.set("x-app-shell", "1");
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|assets/).*)"],
};
