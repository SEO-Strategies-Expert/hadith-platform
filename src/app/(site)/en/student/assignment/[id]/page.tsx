import { StudentAssignmentView } from "@/components/site/StudentAssignmentView";

export const metadata = { title: "Assignment — Student portal" };

export default async function EnglishStudentAssignment({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StudentAssignmentView lang="en" assignmentId={id} />;
}
