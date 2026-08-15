import { StudentQuizAttempts } from "@/components/site/StudentQuizAttempts";

export const metadata = { title: "محاولاتي — بوابة الطالب" };

export default async function ArabicQuizAttempts({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StudentQuizAttempts lang="ar" quizId={id} />;
}
