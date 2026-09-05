import { redirect } from "next/navigation";
import { currentUser } from "@/lib/guard";
import { StudentSessions } from "@/components/site/StudentCourses";

export default async function StudentSessionsPage() {
  const user = await currentUser();
  if (!user?.id) redirect("/student-login.html");
  return <StudentSessions lang="ar" userId={user.id} />;
}
