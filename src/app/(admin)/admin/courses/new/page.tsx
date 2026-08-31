import { getResource } from "@/lib/resources";
import { requireUser } from "@/lib/guard";
import { PageHeader, Card } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { ResourceFields } from "@/components/admin/ResourceFields";
import { createRecord } from "@/lib/crud-actions";
import { withRelationOptions } from "@/lib/resource-options";

export default async function NewCoursePage() {
  await requireUser();
  const cfg = getResource("courses")!;
  const fields = await withRelationOptions(cfg.fields);

  return (
    <div>
      <PageHeader title="إنشاء مقرر جديد" desc="مسار واضح يجمع البيانات والمحتوى والتقييمات ثم النشر." />
      <div className="workflow-steps mb-6">
        <div className="active"><b>١</b><span>بيانات المقرر</span></div><div><b>٢</b><span>المواد والروابط</span></div><div><b>٣</b><span>الاختبارات والتكاليف</span></div><div><b>٤</b><span>المراجعة والنشر</span></div>
      </div>
      <Card className="max-w-3xl p-6">
        <ActionForm action={createRecord.bind(null, "courses")} cancelHref="/admin/courses" submitLabel="حفظ والمتابعة للمحتوى">
          <ResourceFields fields={fields} />
        </ActionForm>
      </Card>
    </div>
  );
}
