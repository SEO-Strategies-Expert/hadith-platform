import Link from "next/link";
import { Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge, EmptyState } from "@/components/admin/ui";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { deleteStudent } from "./actions";

export default async function StudentsPage() {
  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="حسابات الطلاب"
        desc="حسابات الدخول إلى بوابة الطالب. تُنشأ بعد قبول طلب الالتحاق."
        action={{ href: "/admin/students/new", label: "إضافة طالب" }}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href="/admin/inbox/admissions"
          className="rounded-lg border border-black/10 bg-white px-3.5 py-2 text-[12.5px] font-bold text-navy-700 hover:border-gold/50"
        >
          طلبات الالتحاق ←
        </Link>
      </div>

      <Card>
        {students.length === 0 ? (
          <EmptyState label="لا توجد حسابات طلاب بعد." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-[13.5px]">
              <thead>
                <tr className="border-b border-black/5 text-[12px] text-ink-soft">
                  <th className="px-4 py-3 font-bold">الطالب</th>
                  <th className="px-4 py-3 font-bold">الرقم الجامعي</th>
                  <th className="px-4 py-3 font-bold">البرنامج</th>
                  <th className="px-4 py-3 font-bold">الحالة</th>
                  <th className="px-4 py-3 font-bold">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-b border-black/5 last:border-0 hover:bg-cream-50">
                    <td className="px-4 py-3">
                      <div className="font-bold text-navy-900">{s.name}</div>
                      <div className="text-[12px] text-ink-soft" dir="ltr">
                        {s.email}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-soft" dir="ltr">
                      {s.studentNo ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-navy-800">{s.program ?? "—"}</td>
                    <td className="px-4 py-3">
                      {s.status === "ACTIVE" ? (
                        <Badge tone="green">نشط</Badge>
                      ) : (
                        <Badge tone="gray">معطّل</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/admin/students/${s.id}`}
                          className="grid h-9 w-9 place-items-center rounded-lg text-navy-700 hover:bg-black/5"
                          title="تعديل"
                        >
                          <Pencil size={16} />
                        </Link>
                        <DeleteButton action={deleteStudent.bind(null, s.id)} />
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
