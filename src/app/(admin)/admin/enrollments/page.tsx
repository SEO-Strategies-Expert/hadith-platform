import Link from "next/link";
import { Pencil, Filter, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { PageHeader, Card, Badge, EmptyState } from "@/components/admin/ui";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { SearchableSelect } from "@/components/admin/SearchableSelect";
import { ENROLLMENT_STATUSES, statusLabel, statusTone, feeLabel } from "./fields";
import { deleteEnrollment, approveEnrollment } from "./actions";

const SELECT_CLASS =
  "rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-[13px] outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/15";

export default async function EnrollmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ courseId?: string; status?: string }>;
}) {
  await requireUser();
  const sp = await searchParams;

  const courseId = sp.courseId && sp.courseId !== "" ? sp.courseId : undefined;
  const status =
    sp.status && ENROLLMENT_STATUSES.some((s) => s.value === sp.status) ? sp.status : undefined;

  const [courses, enrollments] = await Promise.all([
    prisma.course.findMany({ orderBy: { order: "asc" }, select: { id: true, titleAr: true } }),
    prisma.enrollment.findMany({
      where: {
        ...(courseId ? { courseId } : {}),
        ...(status ? { status: status as "PENDING" | "ACTIVE" | "COMPLETED" | "CANCELLED" } : {}),
      },
      orderBy: { enrolledAt: "desc" },
      include: {
        user: { select: { name: true, email: true, studentNo: true } },
        course: { select: { titleAr: true } },
      },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="تسجيل الطلاب في المقرّرات"
        desc="سجلّ التسجيل هو ما يفتح محتوى المقرّر للطالب — بلا تسجيل لا يرى شيئًا."
        action={{ href: "/admin/enrollments/new", label: "تسجيل طالب" }}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href="/admin/students"
          className="rounded-lg border border-black/10 bg-white px-3.5 py-2 text-[12.5px] font-bold text-navy-700 hover:border-gold/50"
        >
          حسابات الطلاب ←
        </Link>
        <Link
          href="/admin/courses"
          className="rounded-lg border border-black/10 bg-white px-3.5 py-2 text-[12.5px] font-bold text-navy-700 hover:border-gold/50"
        >
          المقرّرات ←
        </Link>
      </div>

      <form method="get" className="mb-5 flex flex-wrap items-center gap-2.5">
        <Filter size={16} className="text-ink-soft" />
        <div className="min-w-[230px] flex-1">
          <SearchableSelect
            label="المقرّر"
            name="courseId"
            defaultValue={courseId ?? ""}
            placeholder="ابحث في المقرّرات…"
            options={[{ value: "", label: "كل المقرّرات" }, ...courses.map((c) => ({ value: c.id, label: c.titleAr }))]}
          />
        </div>
        <select name="status" defaultValue={status ?? ""} className={SELECT_CLASS}>
          <option value="">كل الحالات</option>
          {ENROLLMENT_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-[13px] font-bold text-navy-800 hover:border-gold/50"
        >
          تصفية
        </button>
      </form>

      <Card>
        {enrollments.length === 0 ? (
          <EmptyState label="لا توجد تسجيلات مطابقة. اضغط «تسجيل طالب»." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-[13.5px]">
              <thead>
                <tr className="border-b border-black/5 text-[12px] text-ink-soft">
                  <th className="px-4 py-3 font-bold">الطالب</th>
                  <th className="px-4 py-3 font-bold">المقرّر</th>
                  <th className="px-4 py-3 font-bold">الحالة</th>
                  <th className="px-4 py-3 font-bold">التقدّم</th>
                  <th className="px-4 py-3 font-bold">الرسوم</th>
                  <th className="px-4 py-3 font-bold">تاريخ التسجيل</th>
                  <th className="px-4 py-3 font-bold">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((e) => (
                  <tr key={e.id} className="border-b border-black/5 last:border-0 hover:bg-cream-50">
                    <td className="px-4 py-3">
                      <div className="font-bold text-navy-900">{e.user.name}</div>
                      <div className="text-[12px] text-ink-soft" dir="ltr">
                        {e.user.studentNo ? `${e.user.studentNo} · ` : ""}{e.user.email}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-navy-800">{e.course.titleAr}</td>
                    <td className="px-4 py-3">
                      <Badge tone={statusTone(e.status)}>{statusLabel(e.status)}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-black/10">
                          <div
                            className="h-full rounded-full bg-gradient-to-l from-gold-1 to-gold-3"
                            style={{ width: `${Math.min(100, Math.max(0, e.progressPct))}%` }}
                          />
                        </div>
                        <span className="text-[12px] text-ink-soft">{e.progressPct}٪</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-navy-800">{feeLabel(e.feeOption)}</td>
                    <td className="px-4 py-3 text-ink-soft" dir="ltr">
                      {e.enrolledAt.toISOString().slice(0, 10)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {e.status === "PENDING" && (
                          <form action={approveEnrollment.bind(null, e.id)}>
                            <button
                              type="submit"
                              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[12px] font-bold text-white shadow-sm hover:bg-emerald-700"
                              title="اعتماد التسجيل وتفعيل وصول الطالب للمقرّر"
                            >
                              <CheckCircle2 size={14} />
                              اعتماد
                            </button>
                          </form>
                        )}
                        {e.status === "ACTIVE" && (
                          <form action={approveEnrollment.bind(null, e.id)}>
                            <button
                              type="submit"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-600 bg-white px-3 py-1.5 text-[12px] font-bold text-amber-700 hover:bg-amber-50"
                              title="إلغاء اعتماد التسجيل وإعادته إلى قائمة الانتظار"
                            >
                              <CheckCircle2 size={14} />
                              إلغاء الاعتماد
                            </button>
                          </form>
                        )}
                        {e.status !== "PENDING" && e.status !== "ACTIVE" && (
                          <form action={approveEnrollment.bind(null, e.id)}>
                            <button
                              type="submit"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-600 bg-white px-3 py-1.5 text-[12px] font-bold text-emerald-700 hover:bg-emerald-50"
                              title="إعادة تفعيل التسجيل"
                            >
                              <CheckCircle2 size={14} />
                              تفعيل
                            </button>
                          </form>
                        )}
                        <Link
                          href={`/admin/enrollments/${e.id}`}
                          className="grid h-9 w-9 place-items-center rounded-lg text-navy-700 hover:bg-black/5"
                          title="تعديل"
                        >
                          <Pencil size={16} />
                        </Link>
                        <DeleteButton
                          action={deleteEnrollment.bind(null, e.id)}
                          confirm="سيفقد الطالب وصوله إلى هذا المقرّر. هل أنت متأكد؟"
                        />
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
