import { StudentQuizResult } from "@/components/site/StudentQuizResult";

export const metadata = { title: "Quiz result — Student portal" };

export default async function EnglishQuizResult({
  params,
}: {
  params: Promise<{ id: string; attemptId: string }>;
}) {
  const { id, attemptId } = await params;
  return <StudentQuizResult lang="en" quizId={id} attemptId={attemptId} />;
}
