import type { DefaultSession } from "next-auth";

// يجب أن يطابق enum Role في prisma/schema.prisma — إضافة دور هناك بلا إضافته
// هنا تكسر البناء عند أوّل إسناد للدور القادم من قاعدة البيانات.
type AppRole = "ADMIN" | "EDITOR" | "STUDENT" | "INSTRUCTOR";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: AppRole;
    } & DefaultSession["user"];
  }
  interface User {
    role?: AppRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: AppRole;
    uid?: string;
  }
}
