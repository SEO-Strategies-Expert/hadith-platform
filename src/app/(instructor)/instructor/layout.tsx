import { redirect } from "next/navigation";
import { signOut } from "@/auth";
import { requireInstructor } from "@/lib/instructor";
import { InstructorShell } from "@/components/instructor/InstructorShell";

/**
 * حاجز اللوحة الأوّل: يحوّل بدل أن يرمي، فيرى الزائر شاشةً مفهومة لا خطأً.
 * وليس حاجزًا وحيدًا — كل صفحة تحته تستدعي `requireInstructor()` بنفسها.
 */
export default async function InstructorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const me = await requireInstructor().catch((e: Error) => {
    // `redirect` يرمي، فنوعها `never` — لذا يبقى `me` مضمون القيمة بعدها.
    redirect(e.message === "UNAUTHENTICATED" ? "/login?callbackUrl=/instructor" : "/");
  });

  async function doSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <InstructorShell
      user={{
        name: me.name,
        email: me.email,
        role: me.role,
        scholarName: me.scholarName,
      }}
      signOutAction={doSignOut}
    >
      {children}
    </InstructorShell>
  );
}
