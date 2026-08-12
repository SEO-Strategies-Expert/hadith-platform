import Link from "next/link";
import { Pencil, Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge, EmptyState } from "@/components/admin/ui";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { deleteScholar } from "./actions";

export default async function FacultyPage() {
  const scholars = await prisma.scholar.findMany({ orderBy: { order: "asc" } });

  return (
    <div>
      <PageHeader
        title="الهيئة العلمية"
        desc="أعضاء المجلس العلمي وهيئة التدريس."
        action={{ href: "/admin/faculty/new", label: "إضافة عضو" }}
      />

      <Card>
        {scholars.length === 0 ? (
          <EmptyState label="لا يوجد أعضاء بعد." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-[13.5px]">
              <thead>
                <tr className="border-b border-black/5 text-[12px] text-ink-soft">
                  <th className="px-4 py-3 font-bold">#</th>
                  <th className="px-4 py-3 font-bold">الاسم</th>
                  <th className="px-4 py-3 font-bold">الرتبة</th>
                  <th className="px-4 py-3 font-bold">التخصّص</th>
                  <th className="px-4 py-3 font-bold">الحالة</th>
                  <th className="px-4 py-3 font-bold">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {scholars.map((s) => (
                  <tr key={s.id} className="border-b border-black/5 last:border-0 hover:bg-cream-50">
                    <td className="px-4 py-3 text-ink-soft">{s.order}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 font-bold text-navy-900">
                        {s.isCouncilHead && <Star size={14} className="text-gold-3" fill="currentColor" />}
                        {s.nameAr}
                      </div>
                      <div className="text-[12px] text-ink-soft" dir="ltr">{s.nameEn}</div>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{s.rankAr || "—"}</td>
                    <td className="px-4 py-3 text-ink-soft">{s.specAr || "—"}</td>
                    <td className="px-4 py-3">
                      {s.visible ? <Badge tone="green">ظاهر</Badge> : <Badge tone="gray">مخفي</Badge>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/admin/faculty/${s.id}`}
                          className="grid h-9 w-9 place-items-center rounded-lg text-navy-700 hover:bg-black/5"
                          title="تعديل"
                        >
                          <Pencil size={16} />
                        </Link>
                        <DeleteButton action={deleteScholar.bind(null, s.id)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
