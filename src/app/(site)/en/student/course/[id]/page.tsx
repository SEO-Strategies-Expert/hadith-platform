import { StudentCourseView } from "@/components/site/StudentCourseView";

export const metadata = { title: "Course — Student portal" };

export default async function EnglishStudentCourse({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StudentCourseView lang="en" courseId={id} />;
}
