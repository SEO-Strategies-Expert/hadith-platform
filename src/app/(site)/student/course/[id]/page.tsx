import { StudentCourseView } from "@/components/site/StudentCourseView";

export const metadata = { title: "المقرّر — بوابة الطالب" };

// في Next 16 يصل `params` كوعدٍ يجب انتظاره.
export default async function ArabicStudentCourse({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StudentCourseView lang="ar" courseId={id} />;
}
