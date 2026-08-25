import { StudentQuizAttempts } from "@/components/site/StudentQuizAttempts";

export const metadata = { title: "My attempts — Student portal" };

export default async function EnglishQuizAttempts({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StudentQuizAttempts lang="en" quizId={id} />;
}
