import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const normalizedRole = String(session.user.role ?? "").toUpperCase();
  // حسابات الطلاب لا تدخل اللوحة (الوسيط يحوّلها، وهذا حاجزٌ ثانٍ).
  if (normalizedRole === "STUDENT") redirect("/student");
  // عضو هيئة التدريس لوحته وحدها. التكرار مع proxy.ts مقصود:
  // الحارس الأوسط ليس حدَّ أمانٍ وحيدًا.
  if (normalizedRole === "INSTRUCTOR") redirect("/instructor");
  const role = normalizedRole as "ADMIN" | "EDITOR";

  async function doSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <AdminShell
      user={{
        name: session.user.name,
        email: session.user.email,
        role,
      }}
      signOutAction={doSignOut}
    >
      {children}
    </AdminShell>
  );
}
