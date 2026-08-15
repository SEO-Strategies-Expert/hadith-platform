import { StudentQuizView } from "@/components/site/StudentQuizView";

export const metadata = { title: "اختبار — بوابة الطالب" };

// في Next 16 يصل `params` وعدًا يجب انتظاره.
export default async function ArabicStudentQuiz({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StudentQuizView lang="ar" quizId={id} />;
}
