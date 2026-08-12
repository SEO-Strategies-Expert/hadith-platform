import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Field, TextArea } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { saveSettings } from "../settings/actions";

const SEO_FIELDS = [
  { key: "seo.titleSuffixAr", label: "لاحقة العنوان (عربي)", long: false, ltr: false },
  { key: "seo.titleSuffixEn", label: "لاحقة العنوان (إنجليزي)", long: false, ltr: true },
  { key: "seo.defaultDescAr", label: "الوصف الافتراضي (عربي)", long: true, ltr: false },
  { key: "seo.defaultDescEn", label: "الوصف الافتراضي (إنجليزي)", long: true, ltr: true },
  { key: "seo.ogImage", label: "صورة المشاركة الافتراضية (OG)", long: false, ltr: true },
  { key: "seo.keywordsAr", label: "كلمات مفتاحية (عربي)", long: true, ltr: false },
];

export default async function SeoPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;
  const rows = await prisma.setting.findMany({
    where: { key: { in: SEO_FIELDS.map((f) => f.key) } },
  });
  const map = new Map(rows.map((r) => [r.key, r.value == null ? "" : String(r.value)]));

  return (
    <div>
      <PageHeader title="تحسين محركات البحث (SEO)" desc="عناوين وأوصاف افتراضية وبيانات المشاركة." />
      {saved && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[13px] font-bold text-emerald-700">
          تم الحفظ بنجاح.
        </div>
      )}
      <Card className="max-w-3xl p-6">
        <ActionForm action={saveSettings.bind(null, "/admin/seo")} cancelHref="/admin/seo">
          <div className="grid gap-5 sm:grid-cols-2">
            {SEO_FIELDS.map((f) => (
              <div key={f.key} className={f.long ? "sm:col-span-2" : ""}>
                {f.long ? (
                  <TextArea label={f.label} name={f.key} defaultValue={map.get(f.key) ?? ""} dir={f.ltr ? "ltr" : "rtl"} />
                ) : (
                  <Field label={f.label} name={f.key} defaultValue={map.get(f.key) ?? ""} dir={f.ltr ? "ltr" : "rtl"} />
                )}
              </div>
            ))}
          </div>
        </ActionForm>
      </Card>
    </div>
  );
}
