import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge } from "@/components/admin/ui";
import { inboxes } from "@/lib/inbox";

export default async function InboxHubPage() {
  const [contact, admissions, research, contactNew, admissionsNew, researchNew] = await Promise.all([
    prisma.contactMessage.count(),
    prisma.admissionApplication.count(),
    prisma.researchSubmission.count(),
    prisma.contactMessage.count({ where: { status: "NEW" } }),
    prisma.admissionApplication.count({ where: { status: "NEW" } }),
    prisma.researchSubmission.count({ where: { status: "NEW" } }),
  ]);

  const stats = {
    contact: { total: contact, fresh: contactNew },
    admissions: { total: admissions, fresh: admissionsNew },
    research: { total: research, fresh: researchNew },
  };

  return (
    <div>
      <PageHeader
        title="صندوق الوارد"
        desc="كل ما يُرسله الزوّار من نماذج الموقع — يُحفظ في قاعدة البيانات مباشرةً."
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Object.values(inboxes).map((cfg) => {
          const s = stats[cfg.key];
          return (
            <Link key={cfg.key} href={`/admin/inbox/${cfg.key}`}>
              <Card className="h-full p-5 transition hover:border-gold/50 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <b className="text-[15px] font-extrabold text-navy-900">{cfg.titleAr}</b>
                  {s.fresh > 0 ? (
                    <Badge tone="gold">{s.fresh} جديد</Badge>
                  ) : (
                    <Badge tone="gray">لا جديد</Badge>
                  )}
                </div>
                <p className="mt-1.5 text-[12.5px] text-ink-soft">{cfg.descAr}</p>
                <p className="mt-3 text-[26px] font-extrabold text-navy-900">{s.total}</p>
                <p className="text-[12px] text-ink-soft">الإجمالي</p>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
