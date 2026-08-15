import { StudentQuizResult } from "@/components/site/StudentQuizResult";

export const metadata = { title: "نتيجة الاختبار — بوابة الطالب" };

export default async function ArabicQuizResult({
  params,
}: {
  params: Promise<{ id: string; attemptId: string }>;
}) {
  const { id, attemptId } = await params;
  return <StudentQuizResult lang="ar" quizId={id} attemptId={attemptId} />;
}
