import Link from "next/link";
import { Pencil, ClipboardCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { PageHeader, Card, Badge, EmptyState } from "@/components/admin/ui";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { formatDateTime, SITE_TZ } from "@/components/admin/datetime";
import { deleteAssignment } from "./actions";

/**
 * قراءة الواجبات مع تلخيص حالة تسليماتها.
 * خارج المكوّن عمدًا: قراءة الساعة أثر جانبيّ لا يجوز في جسم مكوّن React.
 */
async function loadAssignments() {
  const rows = await prisma.assignment.findMany({
    orderBy: [{ order: "asc" }, { titleAr: "asc" }],
    include: {
      course: { select: { titleAr: true } },
      submissions: { select: { state: true } },
    },
  });

  const now = Date.now();
  return rows.map((a) => ({
    ...a,
    pending: a.submissions.filter((s) => s.state === "SUBMITTED").length,
    graded: a.submissions.filter((s) => s.state === "GRADED").length,
    overdue: a.dueAt ? a.dueAt.getTime() < now : false,
  }));
}

/**
 * قائمة الواجبات مع عدّاد «بانتظار التصحيح» — وهو الرقم الذي يبحث عنه المصحِّح
 * فعلًا حين يفتح الشاشة، فأبرزناه بدل إخفائه داخل شاشة كل واجب.
 */
export default async function AssignmentsPage({ searchParams }: { searchParams?: Promise<{ page?: string }> }) {
  await requireUser();

  const sp = await searchParams;
  const pageSize = 10;
  const rawPage = Number.parseInt(sp?.page ?? "1", 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const [allAssignments] = await Promise.all([loadAssignments()]);
  const totalPages = Math.max(1, Math.ceil(allAssignments.length / pageSize));
  const assignments = allAssignments.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div>
      <PageHeader
        title="الواجبات"
        desc={`واجبات المقرّرات وتسليمات الطلاب وتصحيحها. المواعيد بتوقيت ${SITE_TZ}.`}
        action={{ href: "/admin/assignments/new", label: "إضافة واجب" }}
      />

      <Card>
        {assignments.length === 0 ? (
          <EmptyState label="لا واجبات بعد. اضغط «إضافة واجب»." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-[13.5px]">
              <thead>
                <tr className="border-b border-black/5 text-[12px] text-ink-soft">
                  <th className="px-4 py-3 font-bold">الواجب</th>
                  <th className="px-4 py-3 font-bold">المقرّر</th>
                  <th className="px-4 py-3 font-bold">الموعد النهائي</th>
                  <th className="px-4 py-3 font-bold">الدرجة القصوى</th>
                  <th className="px-4 py-3 font-bold">التسليمات</th>
                  <th className="px-4 py-3 font-bold">الحالة</th>
                  <th className="px-4 py-3 font-bold">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => {
                  const { pending, graded, overdue } = a;
                  return (
                    <tr key={a.id} className="border-b border-black/5 last:border-0 hover:bg-cream-50">
                      <td className="px-4 py-3">
                        <div className="font-bold text-navy-900">{a.titleAr}</div>
                        <div className="text-[12px] text-ink-soft" dir="ltr">
                          {a.titleEn}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-navy-800">{a.course.titleAr}</td>
                      <td className="px-4 py-3 text-navy-800">
                        {a.dueAt ? formatDateTime(a.dueAt) : "بلا موعد"}
                        {overdue && (
                          <span className="block text-[11.5px] font-bold text-amber-700">انقضى</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-navy-800">{a.maxScore}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1">
                          {pending > 0 ? (
                            <Badge tone="red">{pending} بانتظار التصحيح</Badge>
                          ) : (
                            <Badge tone="gray">لا معلَّقات</Badge>
                          )}
                          {graded > 0 && <Badge tone="green">{graded} مُصحَّح</Badge>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {a.visible ? <Badge tone="green">ظاهر</Badge> : <Badge tone="gray">مخفي</Badge>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/admin/assignments/${a.id}/submissions`}
                            className="grid h-9 w-9 place-items-center rounded-lg text-navy-700 hover:bg-black/5"
                            title="التصحيح"
                          >
                            <ClipboardCheck size={16} />
                          </Link>
                          <Link
                            href={`/admin/assignments/${a.id}`}
                            className="grid h-9 w-9 place-items-center rounded-lg text-navy-700 hover:bg-black/5"
                            title="تعديل"
                          >
                            <Pencil size={16} />
                          </Link>
                          <DeleteButton
                            action={deleteAssignment.bind(null, a.id)}
                            confirm="سيُحذف الواجب بكل تسليمات الطلاب ودرجاتها. هل أنت متأكد؟"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && <div className="flex items-center justify-between border-t border-black/5 px-4 py-3 text-[13px]"><span className="text-ink-soft">صفحة {page} من {totalPages}</span><div className="flex gap-2"><Link href={page > 1 ? `/admin/assignments?page=${page - 1}` : "#"} className={`rounded-lg border px-3 py-1.5 font-bold ${page <= 1 ? "pointer-events-none opacity-40" : "border-black/10 bg-white text-navy-700"}`}>السابق</Link><Link href={page < totalPages ? `/admin/assignments?page=${page + 1}` : "#"} className={`rounded-lg border px-3 py-1.5 font-bold ${page >= totalPages ? "pointer-events-none opacity-40" : "border-black/10 bg-white text-navy-700"}`}>التالي</Link></div></div>}
      </Card>
    </div>
  );
}
