import { redirect } from "next/navigation";
import { currentUser } from "@/lib/guard";
import { StudentSessions } from "@/components/site/StudentCourses";

export default async function EnglishStudentSessionsPage() {
  const user = await currentUser();
  if (!user?.id) redirect("/en/student-login.html");
  return <StudentSessions lang="en" userId={user.id} />;
}
