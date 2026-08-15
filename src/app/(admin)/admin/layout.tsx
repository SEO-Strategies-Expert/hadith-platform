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
