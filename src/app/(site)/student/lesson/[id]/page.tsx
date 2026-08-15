import { StudentLessonView } from "@/components/site/StudentLessonView";

export const metadata = { title: "الدرس — بوابة الطالب" };

export default async function ArabicStudentLesson({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StudentLessonView lang="ar" lessonId={id} />;
}
