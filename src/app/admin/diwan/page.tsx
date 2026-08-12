import { PageHeader, HubGrid } from "@/components/admin/ui";

export default function DiwanHubPage() {
  return (
    <div>
      <PageHeader title="ديوان العلماء" desc="إدارة مجالس المذاكرة العلمية وتصنيفاتها." />
      <HubGrid
        items={[
          { href: "/admin/threads", label: "مجالس الديوان", desc: "إضافة وتعديل المجالس العلمية." },
          { href: "/admin/categories", label: "تصنيفات الديوان", desc: "أقسام الديوان." },
        ]}
      />
    </div>
  );
}
