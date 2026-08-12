import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  // احمِ لوحة التحكم فقط
  matcher: ["/admin/:path*"],
};
