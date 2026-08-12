import { PageHeader, Card } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { StageFields } from "../StageFields";
import { createStage } from "../actions";

export default function NewStagePage() {
  return (
    <div>
      <PageHeader title="إضافة مرحلة" desc="البرامج والمقرّرات" />
      <Card className="max-w-3xl p-6">
        <ActionForm action={createStage} cancelHref="/admin/programs">
          <StageFields />
        </ActionForm>
      </Card>
    </div>
  );
}
