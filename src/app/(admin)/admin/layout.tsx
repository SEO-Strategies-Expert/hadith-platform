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
  // حسابات الطلاب لا تدخل اللوحة (الوسيط يحوّلها، وهذا حاجزٌ ثانٍ).
  if (session.user.role === "STUDENT") redirect("/student");
  // عضو هيئة التدريس لوحته وحدها. التكرار مع proxy.ts مقصود:
  // الحارس الأوسط ليس حدَّ أمانٍ وحيدًا.
  if (session.user.role === "INSTRUCTOR") redirect("/instructor");
  const role = session.user.role;

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
