import { PageHeader, Card } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { ScholarFields } from "../ScholarFields";
import { createScholar } from "../actions";

export default function NewScholarPage() {
  return (
    <div>
      <PageHeader title="إضافة عضو هيئة علمية" />
      <Card className="max-w-3xl p-6">
        <ActionForm action={createScholar} cancelHref="/admin/faculty">
          <ScholarFields />
        </ActionForm>
      </Card>
    </div>
  );
}
