import Link from "next/link";
import { notFound } from "next/navigation";
import { Eye } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge, EmptyState } from "@/components/admin/ui";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { getInbox, inboxes, STATUS_LABELS } from "@/lib/inbox";
import { deleteEntry } from "../actions";

/* eslint-disable @typescript-eslint/no-explicit-any */

const TONES: Record<string, "gold" | "blue" | "green" | "gray"> = {
  NEW: "gold",
  IN_PROGRESS: "blue",
  DONE: "green",
  ARCHIVED: "gray",
};

function fmt(d: Date): string {
  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(d);
}

export default async function InboxListPage({
  params,
}: {
  params: Promise<{ kind: string }>;
}) {
  const { kind } = await params;
  const cfg = getInbox(kind);
  if (!cfg) notFound();

  const rows: any[] = await (prisma as any)[cfg.model].findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <PageHeader title={cfg.titleAr} desc={cfg.descAr} />

      <div className="mb-4 flex flex-wrap gap-2">
        {Object.values(inboxes).map((c) => (
          <Link
            key={c.key}
            href={`/admin/inbox/${c.key}`}
            className={`rounded-lg border px-3.5 py-2 text-[12.5px] font-bold ${
              c.key === cfg.key
                ? "border-gold/60 bg-gold/10 text-navy-900"
                : "border-black/10 bg-white text-navy-700 hover:border-gold/50"
            }`}
          >
            {c.titleAr}
          </Link>
        ))}
      </div>

      <Card>
        {rows.length === 0 ? (
          <EmptyState label={`لا توجد ${cfg.titleAr} بعد.`} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-[13.5px]">
              <thead>
                <tr className="border-b border-black/5 text-[12px] text-ink-soft">
                  <th className="px-4 py-3 font-bold">الحالة</th>
                  {cfg.columns.map((c) => (
                    <th key={c.name} className="px-4 py-3 font-bold">
                      {c.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 font-bold">التاريخ</th>
                  <th className="px-4 py-3 font-bold">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className={`border-b border-black/5 last:border-0 hover:bg-cream-50 ${
                      row.status === "NEW" ? "bg-gold/[0.04]" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <Badge tone={TONES[row.status] ?? "gray"}>
                        {STATUS_LABELS[row.status] ?? row.status}
                      </Badge>
                    </td>
                    {cfg.columns.map((c) => {
                      const v = row[c.name];
                      const s = v == null || v === "" ? "—" : String(v);
                      return (
                        <td key={c.name} className="px-4 py-3 text-navy-800">
                          {s.length > 48 ? s.slice(0, 48) + "…" : s}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-[12px] text-ink-soft" dir="ltr">
                      {fmt(row.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/admin/inbox/${cfg.key}/${row.id}`}
                          className="grid h-9 w-9 place-items-center rounded-lg text-navy-700 hover:bg-black/5"
                          title="عرض"
                        >
                          <Eye size={16} />
                        </Link>
                        <DeleteButton action={deleteEntry.bind(null, cfg.key, row.id)} />
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
