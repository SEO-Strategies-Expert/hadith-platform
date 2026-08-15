import { StudentLessonView } from "@/components/site/StudentLessonView";

export const metadata = { title: "Lesson — Student portal" };

export default async function EnglishStudentLesson({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StudentLessonView lang="en" lessonId={id} />;
}
