import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getResource } from "@/lib/resources";
import { PageHeader, Card, Badge, EmptyState } from "@/components/admin/ui";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { deleteRecord } from "@/lib/crud-actions";

/* eslint-disable @typescript-eslint/no-explicit-any */

function cell(kind: string | undefined, value: any) {
  if (kind === "bool")
    return value ? <Badge tone="green">نعم</Badge> : <Badge tone="gray">لا</Badge>;
  if (kind === "badge") return value ? <Badge tone="gold">{value}</Badge> : "—";
  if (kind === "image")
    return value ? <span className="text-[11.5px] text-ink-soft" dir="ltr">{String(value).split("/").pop()}</span> : "—";
  const s = value == null || value === "" ? "—" : String(value);
  return s.length > 60 ? s.slice(0, 60) + "…" : s;
}

export default async function ResourceListPage({
  params,
}: {
  params: Promise<{ resource: string }>;
}) {
  const { resource } = await params;
  const cfg = getResource(resource);
  if (!cfg) notFound();

  const rows: any[] = await (prisma as any)[cfg.model].findMany({
    orderBy: cfg.orderBy ?? { order: "asc" },
  });

  return (
    <div>
      <PageHeader
        title={cfg.titleAr}
        desc={cfg.descAr}
        action={{ href: `/admin/${resource}/new`, label: `إضافة ${cfg.singularAr}` }}
      />

      {cfg.siblings && cfg.siblings.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {cfg.siblings.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="rounded-lg border border-black/10 bg-white px-3.5 py-2 text-[12.5px] font-bold text-navy-700 hover:border-gold/50"
            >
              {s.label} ←
            </Link>
          ))}
        </div>
      )}

      <Card>
        {rows.length === 0 ? (
          <EmptyState label={`لا توجد عناصر بعد. اضغط «إضافة ${cfg.singularAr}».`} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-[13.5px]">
              <thead>
                <tr className="border-b border-black/5 text-[12px] text-ink-soft">
                  {cfg.columns.map((c) => (
                    <th key={c.name} className="px-4 py-3 font-bold">{c.label}</th>
                  ))}
                  <th className="px-4 py-3 font-bold">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-black/5 last:border-0 hover:bg-cream-50">
                    {cfg.columns.map((c) => (
                      <td key={c.name} className="px-4 py-3 text-navy-800">
                        {cell(c.kind, row[c.name])}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/admin/${resource}/${row.id}`}
                          className="grid h-9 w-9 place-items-center rounded-lg text-navy-700 hover:bg-black/5"
                          title="تعديل"
                        >
                          <Pencil size={16} />
                        </Link>
                        <DeleteButton action={deleteRecord.bind(null, resource, row.id)} />
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
