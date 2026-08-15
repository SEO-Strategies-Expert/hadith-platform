import { StudentAssignmentView } from "@/components/site/StudentAssignmentView";

export const metadata = { title: "واجب — بوابة الطالب" };

export default async function ArabicStudentAssignment({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StudentAssignmentView lang="ar" assignmentId={id} />;
}
