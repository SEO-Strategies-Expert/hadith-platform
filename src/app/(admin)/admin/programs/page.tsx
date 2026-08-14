import Link from "next/link";
import { Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge, EmptyState } from "@/components/admin/ui";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { deleteStage } from "./actions";

export default async function ProgramsPage() {
  const stages = await prisma.programStage.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { courses: true } } },
  });

  return (
    <div>
      <PageHeader
        title="البرامج والمقرّرات"
        desc="مراحل التخصّص الثلاث ومقرّراتها."
        action={{ href: "/admin/programs/new", label: "إضافة مرحلة" }}
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href="/admin/courses"
          className="rounded-lg border border-black/10 bg-white px-3.5 py-2 text-[12.5px] font-bold text-navy-700 hover:border-gold/50"
        >
          المقرّرات الدراسية ←
        </Link>
      </div>
      <Card>
        {stages.length === 0 ? (
          <EmptyState label="لا توجد مراحل بعد." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-[13.5px]">
              <thead>
                <tr className="border-b border-black/5 text-[12px] text-ink-soft">
                  <th className="px-4 py-3 font-bold">#</th>
                  <th className="px-4 py-3 font-bold">المرحلة</th>
                  <th className="px-4 py-3 font-bold">المفتاح</th>
                  <th className="px-4 py-3 font-bold">المقرّرات</th>
                  <th className="px-4 py-3 font-bold">الحالة</th>
                  <th className="px-4 py-3 font-bold">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {stages.map((s) => (
                  <tr key={s.id} className="border-b border-black/5 last:border-0 hover:bg-cream-50">
                    <td className="px-4 py-3 text-ink-soft">{s.order}</td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-navy-900">{s.titleAr}</div>
                      <div className="text-[12px] text-ink-soft" dir="ltr">{s.titleEn}</div>
                    </td>
                    <td className="px-4 py-3 text-ink-soft" dir="ltr">{s.key}</td>
                    <td className="px-4 py-3 text-ink-soft">{s._count.courses}</td>
                    <td className="px-4 py-3">
                      {s.visible ? <Badge tone="green">ظاهر</Badge> : <Badge tone="gray">مخفي</Badge>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link href={`/admin/programs/${s.id}`} className="grid h-9 w-9 place-items-center rounded-lg text-navy-700 hover:bg-black/5" title="تعديل">
                          <Pencil size={16} />
                        </Link>
                        <DeleteButton action={deleteStage.bind(null, s.id)} />
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
