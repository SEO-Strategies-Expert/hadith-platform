import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Field, TextArea, Select } from "@/components/admin/ui";
import { ImagePickerField } from "@/components/admin/ImagePickerField";
import { ActionForm } from "@/components/admin/ActionForm";
import { updatePage } from "../actions";
import { RichTextEditor } from "@/components/admin/RichTextEditor";

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-black/6 bg-white p-5 shadow-sm sm:p-6">
      <h3 className="mb-1 text-[16px] font-extrabold text-navy-900">{title}</h3>
      {desc && <p className="mb-3 text-[12px] text-ink-soft">{desc}</p>}
      <div className={`grid gap-5 sm:grid-cols-2 ${desc ? "mt-3" : ""}`}>{children}</div>
    </section>
  );
}

export default async function EditPagePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = await prisma.page.findUnique({ where: { slug } });
  if (!p) notFound();

  return (
    <div>
      <PageHeader title={`تحرير: ${p.titleAr}`} desc={`المعرّف: ${slug}`} />
      <Card className="max-w-5xl bg-slate-50/70 p-4 sm:p-6">
        <ActionForm action={updatePage.bind(null, slug)} cancelHref="/admin/pages">
          <div className="space-y-7">
            <Section title="العنوان والوصف">
              <Field label="العنوان (عربي)" name="titleAr" defaultValue={p.titleAr} required />
              <Field label="Title (English)" name="titleEn" defaultValue={p.titleEn} dir="ltr" required />
              <div className="sm:col-span-2">
                <TextArea label="وصف الميتا (عربي)" name="metaDescAr" defaultValue={p.metaDescAr} dir="rtl" />
              </div>
              <div className="sm:col-span-2">
                <TextArea label="Meta description (English)" name="metaDescEn" defaultValue={p.metaDescEn} dir="ltr" />
              </div>
            </Section>

            <Section
              title="واجهة الصفحة (Hero)"
              desc={
                slug === "index"
                  ? "الرئيسية لها تصميمٌ خاص — هذه الحقول لا تنطبق عليها؛ عدّل محتواها من قسم «محتوى الصفحة» أدناه."
                  : "تُطبَّق هذه الحقول مباشرةً على شريط الواجهة أعلى الصفحة عند الحفظ."
              }
            >
              <Field label="التمهيد (عربي)" name="heroKickerAr" defaultValue={p.heroKickerAr} />
              <Field label="Kicker (English)" name="heroKickerEn" defaultValue={p.heroKickerEn} dir="ltr" />
              <Field label="عنوان الواجهة (عربي)" name="heroTitleAr" defaultValue={p.heroTitleAr} />
              <Field label="Hero title (English)" name="heroTitleEn" defaultValue={p.heroTitleEn} dir="ltr" />
              <div className="sm:col-span-2">
                <TextArea label="مقدّمة الواجهة (عربي)" name="heroIntroAr" defaultValue={p.heroIntroAr} dir="rtl" />
              </div>
              <div className="sm:col-span-2">
                <TextArea label="Hero intro (English)" name="heroIntroEn" defaultValue={p.heroIntroEn} dir="ltr" />
              </div>
              <div className="sm:col-span-2">
                <ImagePickerField label="صورة الواجهة" name="heroImage" defaultValue={p.heroImage} />
              </div>
            </Section>

            <Section title="نصوص الصفحة" desc="هذه الواجهة تحمي تصميم الصفحة: يمكنك تعديل الكلمات فقط، وتبقى الصور والتنسيقات والأقسام كما هي.">
              <div className="sm:col-span-2">
                <RichTextEditor label="المحتوى (عربي)" name="bodyHtmlAr" value={p.bodyHtmlAr} dir="rtl" />
              </div>
              <details className="sm:col-span-2 rounded-xl border border-black/8 bg-white p-4">
                <summary className="cursor-pointer text-[13px] font-extrabold text-navy-800">تعديل المحتوى الإنجليزي</summary>
                <div className="mt-4"><RichTextEditor label="Content (English)" name="bodyHtmlEn" value={p.bodyHtmlEn} dir="ltr" /></div>
              </details>
            </Section>

            <Section title="SEO والحالة">
              <Field label="عنوان SEO (عربي)" name="seoTitleAr" defaultValue={p.seoTitleAr} />
              <Field label="SEO title (English)" name="seoTitleEn" defaultValue={p.seoTitleEn} dir="ltr" />
              <div className="sm:col-span-2">
                <TextArea label="وصف SEO (عربي)" name="seoDescAr" defaultValue={p.seoDescAr} dir="rtl" />
              </div>
              <div className="sm:col-span-2">
                <TextArea label="SEO description (English)" name="seoDescEn" defaultValue={p.seoDescEn} dir="ltr" />
              </div>
              <div className="sm:col-span-2">
                <ImagePickerField label="صورة المشاركة (OG)" name="ogImage" defaultValue={p.ogImage} />
              </div>
              <Select
                label="الحالة"
                name="status"
                defaultValue={p.status}
                options={[
                  { value: "PUBLISHED", label: "منشورة" },
                  { value: "DRAFT", label: "مسودّة" },
                ]}
              />
            </Section>
          </div>
        </ActionForm>
      </Card>
    </div>
  );
}
