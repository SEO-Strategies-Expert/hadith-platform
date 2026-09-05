import Link from "next/link";
import { Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge, EmptyState } from "@/components/admin/ui";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { deleteStudent } from "./actions";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string; studentNo?: string; program?: string }>;
}) {
  const params = await searchParams;
  const name = params.name?.trim() ?? "";
  const studentNo = params.studentNo?.trim() ?? "";
  const program = params.program?.trim() ?? "";
  const [students, programRows] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: "STUDENT",
        ...(name ? { name: { contains: name, mode: "insensitive" } } : {}),
        ...(studentNo ? { studentNo: { contains: studentNo, mode: "insensitive" } } : {}),
        ...(program ? { program } : {}),
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: { role: "STUDENT", program: { not: null } },
      select: { program: true },
      distinct: ["program"],
      orderBy: { program: "asc" },
    }),
  ]);
  const programs = programRows.map((row) => row.program).filter((value): value is string => Boolean(value));

  return (
    <div>
      <PageHeader
        title="حسابات الطلاب"
        desc="حسابات الدخول إلى بوابة الطالب. تُنشأ بعد قبول طلب الالتحاق."
        action={{ href: "/admin/students/new", label: "إضافة طالب" }}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Link href="/admin/students/import" className="rounded-lg border border-black/10 bg-white px-3.5 py-2 text-[12.5px] font-bold text-navy-700">استيراد CSV</Link>
        <Link href="/api/admin/students/export" className="rounded-lg border border-black/10 bg-white px-3.5 py-2 text-[12.5px] font-bold text-navy-700">تصدير CSV</Link>
        <Link
          href="/admin/inbox/admissions"
          className="rounded-lg border border-black/10 bg-white px-3.5 py-2 text-[12.5px] font-bold text-navy-700 hover:border-gold/50"
        >
          طلبات الالتحاق ←
        </Link>
      </div>

      <form method="get" className="mb-5 flex flex-wrap items-end gap-2.5 rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
        <label className="min-w-[220px] flex-1">
          <span className="mb-1.5 block text-[12px] font-bold text-navy-900">اسم الطالب</span>
          <input name="name" defaultValue={name} placeholder="ابحث بالاسم…" className="w-full rounded-xl border border-black/10 px-3 py-2.5 text-[13px] outline-none focus:border-gold focus:ring-4 focus:ring-gold/15" />
        </label>
        <label className="min-w-[180px] flex-1">
          <span className="mb-1.5 block text-[12px] font-bold text-navy-900">الرقم الجامعي</span>
          <input name="studentNo" defaultValue={studentNo} placeholder="مثال: ST-001…" dir="ltr" className="w-full rounded-xl border border-black/10 px-3 py-2.5 text-[13px] outline-none focus:border-gold focus:ring-4 focus:ring-gold/15" />
        </label>
        <label className="min-w-[200px] flex-1">
          <span className="mb-1.5 block text-[12px] font-bold text-navy-900">البرنامج</span>
          <select name="program" defaultValue={program} className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-[13px] outline-none focus:border-gold focus:ring-4 focus:ring-gold/15">
            <option value="">كل البرامج</option>
            {programs.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <button type="submit" className="rounded-xl bg-gradient-to-l from-gold-1 to-gold-3 px-5 py-2.5 text-[13px] font-extrabold text-navy-950 shadow-sm hover:brightness-105">بحث</button>
        {(name || studentNo || program) && <Link href="/admin/students" className="rounded-xl border border-black/10 px-4 py-2.5 text-[13px] font-bold text-ink-soft hover:bg-black/5">مسح</Link>}
      </form>

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
