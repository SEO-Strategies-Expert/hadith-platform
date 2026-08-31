import { requireUser } from "@/lib/guard";
import { PageHeader, Card } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { ResourceFields } from "@/components/admin/ResourceFields";
import { withRelationOptions } from "@/lib/resource-options";
import { quizFields } from "../fields";
import { createQuiz } from "../actions";

export default async function NewQuizPage({ searchParams }: { searchParams: Promise<{ courseId?: string; moduleId?: string; afterLessonId?: string }> }) {
  await requireUser();
  const context = await searchParams;
  const fields = await withRelationOptions(quizFields);

  return (
    <div>
      <PageHeader title="إضافة اختبار" desc={context.moduleId ? "سيُضاف الاختبار داخل الوحدة في موضعه، ثم تُفتح شاشة إضافة الأسئلة." : "بعد الحفظ تُفتح شاشة الأسئلة مباشرةً."} />
      <Card className="max-w-3xl p-6">
        <ActionForm action={createQuiz} cancelHref={context.courseId ? `/admin/courses/${context.courseId}/content` : "/admin/quizzes"}>
          {context.moduleId && <input type="hidden" name="moduleId" value={context.moduleId} />}
          {context.afterLessonId && <input type="hidden" name="afterLessonId" value={context.afterLessonId} />}
          <ResourceFields
            fields={fields}
            record={{ courseId: context.courseId, passScore: 60, attemptsAllowed: 0, shuffle: true, visible: true }}
          />
        </ActionForm>
      </Card>
    </div>
  );
}
