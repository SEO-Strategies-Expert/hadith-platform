import { redirect } from "next/navigation";
import { currentUser } from "@/lib/guard";
import { StudentCourses } from "@/components/site/StudentCourses";

export default async function StudentCoursesPage() {
  const user = await currentUser();
  if (!user?.id) redirect("/student-login.html");
  return <StudentCourses lang="ar" userId={user.id} />;
}
