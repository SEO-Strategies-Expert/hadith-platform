import { StudentQuizView } from "@/components/site/StudentQuizView";

export const metadata = { title: "Quiz — Student portal" };

export default async function EnglishStudentQuiz({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StudentQuizView lang="en" quizId={id} />;
}
