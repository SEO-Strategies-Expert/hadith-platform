import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { StudentFields } from "@/components/admin/StudentFields";
import { updateStudent } from "../actions";

export default async function EditStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const student = await prisma.user.findUnique({ where: { id } });
  if (!student || student.role !== "STUDENT") notFound();

  return (
    <div>
      <PageHeader title="تعديل بيانات طالب" desc={student.email} />
      <Card className="max-w-2xl p-6">
        <ActionForm action={updateStudent.bind(null, id)} cancelHref="/admin/students">
          <StudentFields record={student} />
        </ActionForm>
      </Card>
    </div>
  );
}
