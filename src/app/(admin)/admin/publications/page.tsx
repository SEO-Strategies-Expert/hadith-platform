import { PageHeader, HubGrid } from "@/components/admin/ui";

export default function PublicationsHubPage() {
  return (
    <div>
      <PageHeader title="الإصدارات والمجلة" desc="المجلة العلمية المحكّمة وأبحاثها." />
      <HubGrid
        items={[
          { href: "/admin/papers", label: "الأبحاث المحكّمة", desc: "قائمة الأبحاث المنشورة." },
          { href: "/admin/issues", label: "أعداد المجلة", desc: "أغلفة وأعداد المجلة." },
        ]}
      />
    </div>
  );
}
