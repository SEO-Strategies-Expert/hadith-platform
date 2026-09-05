import { redirect } from "next/navigation";
import { currentUser } from "@/lib/guard";
import { StudentCourses } from "@/components/site/StudentCourses";

export default async function EnglishStudentCoursesPage() {
  const user = await currentUser();
  if (!user?.id) redirect("/en/student-login.html");
  return <StudentCourses lang="en" userId={user.id} />;
}
