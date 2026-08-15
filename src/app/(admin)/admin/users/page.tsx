import Link from "next/link";
import { redirect } from "next/navigation";
import { Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guard";
import { PageHeader, Card, Badge, EmptyState } from "@/components/admin/ui";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { deleteUser } from "./actions";

export default async function UsersPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/admin");
  }

  // حسابات الطلاب لها قسمها الخاصّ — هذه الشاشة لطاقم اللوحة.
  const users = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "EDITOR"] } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="المستخدمون والأدوار"
        desc="إدارة المديرين والمحرّرين وصلاحياتهم."
        action={{ href: "/admin/users/new", label: "إضافة مستخدم" }}
      />

      <Card>
        {users.length === 0 ? (
          <EmptyState label="لا يوجد مستخدمون بعد." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-[13.5px]">
              <thead>
                <tr className="border-b border-black/5 text-[12px] text-ink-soft">
                  <th className="px-4 py-3 font-bold">المستخدم</th>
                  <th className="px-4 py-3 font-bold">البريد</th>
                  <th className="px-4 py-3 font-bold">الدور</th>
                  <th className="px-4 py-3 font-bold">الحالة</th>
                  <th className="px-4 py-3 font-bold">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-black/5 last:border-0 hover:bg-cream-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 place-items-center rounded-full bg-navy-800 text-[13px] font-bold text-gold-1">
                          {u.name.charAt(0)}
                        </span>
                        <span className="font-bold text-navy-900">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-soft" dir="ltr">{u.email}</td>
                    <td className="px-4 py-3">
                      <Badge tone={u.role === "ADMIN" ? "gold" : "blue"}>
                        {u.role === "ADMIN" ? "مدير" : "محرّر"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={u.status === "ACTIVE" ? "green" : "red"}>
                        {u.status === "ACTIVE" ? "نشط" : "معطّل"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/admin/users/${u.id}`}
                          className="grid h-9 w-9 place-items-center rounded-lg text-navy-700 hover:bg-black/5"
                          title="تعديل"
                        >
                          <Pencil size={16} />
                        </Link>
                        <DeleteButton action={deleteUser.bind(null, u.id)} />
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
