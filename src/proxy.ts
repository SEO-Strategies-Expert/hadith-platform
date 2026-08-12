import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

// وظيفتان: 1) حماية /admin لغير المسجَّلين  2) تمرير المسار/اللغة الحاليَين
// كترويسة داخلية ليقرأها التخطيط الجذري لمجموعة (site) ويضبط lang/dir.
export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin") && !req.auth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const isEnglish = pathname === "/en" || pathname.startsWith("/en/");
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);
  requestHeaders.set("x-lang", isEnglish ? "en" : "ar");

  return NextResponse.next({ request: { headers: requestHeaders } });
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|assets/).*)"],
};
