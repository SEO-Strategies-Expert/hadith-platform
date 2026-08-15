import { requireUser } from "@/lib/guard";
import { PageHeader, Card } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { ResourceFields } from "@/components/admin/ResourceFields";
import { withRelationOptions } from "@/lib/resource-options";
import { quizFields } from "../fields";
import { createQuiz } from "../actions";

export default async function NewQuizPage() {
  await requireUser();
  const fields = await withRelationOptions(quizFields);

  return (
    <div>
      <PageHeader title="إضافة اختبار" desc="بعد الحفظ تُفتح شاشة الأسئلة مباشرةً." />
      <Card className="max-w-3xl p-6">
        <ActionForm action={createQuiz} cancelHref="/admin/quizzes">
          <ResourceFields
            fields={fields}
            record={{ passScore: 60, attemptsAllowed: 0, shuffle: true, visible: true }}
          />
        </ActionForm>
      </Card>
    </div>
  );
}
