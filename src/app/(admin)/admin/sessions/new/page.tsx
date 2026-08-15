import { requireUser } from "@/lib/guard";
import { isZoomConfigured } from "@/lib/zoom";
import { PageHeader, Card, Checkbox } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { ResourceFields } from "@/components/admin/ResourceFields";
import { withRelationOptions } from "@/lib/resource-options";
import { sessionFields } from "../fields";
import { createSession } from "../actions";

export default async function NewSessionPage() {
  await requireUser();
  const fields = await withRelationOptions(sessionFields);
  const zoomReady = isZoomConfigured();

  return (
    <div>
      <PageHeader title="إضافة مجلس مباشر" desc="المجالس المباشرة" />
      <Card className="max-w-3xl p-6">
        <ActionForm action={createSession} cancelHref="/admin/sessions">
          <ResourceFields
            fields={fields}
            record={{ durationMin: 90, provider: "zoom", visible: true }}
          />

          {/* الخيار لا يظهر أصلًا بلا مفاتيح، فلا تنكسر الشاشة في الوضع اليدوي. */}
          {zoomReady && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5">
              <Checkbox
                label="أنشئ مجلس Zoom تلقائيًّا عند الحفظ (يملأ رابط الانضمام ورمز الدخول)"
                name="autoZoom"
                defaultChecked
              />
              <p className="mt-2 pe-7 text-[11.5px] leading-6 text-emerald-800">
                إن تعذّر الاتصال بـZoom يُحفظ المجلس على كل حال، ويمكنك لصق الرابط يدويًّا.
              </p>
            </div>
          )}
        </ActionForm>
      </Card>
    </div>
  );
}
