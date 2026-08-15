import { PageHeader, Card } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { StudentFields } from "@/components/admin/StudentFields";
import { createStudent } from "../actions";

export default function NewStudentPage() {
  return (
    <div>
      <PageHeader title="إضافة طالب" desc="ينشئ حساب دخول لبوابة الطالب." />
      <Card className="max-w-2xl p-6">
        <ActionForm action={createStudent} cancelHref="/admin/students">
          <StudentFields />
        </ActionForm>
      </Card>
    </div>
  );
}
