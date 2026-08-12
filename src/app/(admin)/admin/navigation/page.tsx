import { PageHeader, HubGrid } from "@/components/admin/ui";

export default function NavigationHubPage() {
  return (
    <div>
      <PageHeader title="التنقّل والقوائم" desc="روابط الهيدر والفوتر ومنصّات التواصل وشرائح الواجهة." />
      <HubGrid
        items={[
          { href: "/admin/nav", label: "روابط الهيدر والفوتر", desc: "قوائم التنقّل." },
          { href: "/admin/social", label: "منصّات التواصل", desc: "روابط السوشيال." },
          { href: "/admin/slides", label: "شرائح الهيرو", desc: "صور واجهة الرئيسية." },
        ]}
      />
    </div>
  );
}
