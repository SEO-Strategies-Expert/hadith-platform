import Link from "next/link";
import { Pencil, ListTree } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { PageHeader, Card, Badge, EmptyState } from "@/components/admin/ui";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { deleteRecord } from "@/lib/crud-actions";

/**
 * قائمة المقرّرات.
 *
 * هذه الشاشة تحلّ محلّ شاشة المحرّك العام `/admin/[resource]` للمقرّرات (المسار
 * الثابت يسبق الديناميكي)، لأنّ المقرّر ليس سجلًّا مسطَّحًا: من كل صفّ ندخل إلى
 * شجرة محتواه. أمّا نموذج بيانات المقرّر نفسه فما زال يُقرأ من `resources.ts`
 * ويُحفظ بإجراءات المحرّك العام، فلا يتكرّر التعريف في موضعين.
 */
export default async function CoursesPage() {
  await requireUser();

  const courses = await prisma.course.findMany({
    orderBy: [{ order: "asc" }, { titleAr: "asc" }],
    include: {
      stage: { select: { titleAr: true } },
      instructor: { select: { nameAr: true } },
      _count: { select: { enrollments: true } },
      modules: { select: { _count: { select: { lessons: true } } } },
    },
  });

  return (
    <div>
      <PageHeader
        title="المقرّرات الدراسية"
        desc="بيانات المقرّر ومحتواه العلمي. المقرّر بلا وحدات ودروس يظهر فارغًا في بوابة الطالب."
        action={{ href: "/admin/courses/new", label: "إضافة مقرّر" }}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { href: "/admin/programs", label: "مراحل البرنامج" },
          { href: "/admin/enrollments", label: "تسجيل الطلاب" },
          { href: "/admin/sessions", label: "المجالس المباشرة" },
        ].map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="rounded-lg border border-black/10 bg-white px-3.5 py-2 text-[12.5px] font-bold text-navy-700 hover:border-gold/50"
          >
            {s.label} ←
          </Link>
        ))}
      </div>

      <Card>
        {courses.length === 0 ? (
          <EmptyState label="لا توجد مقرّرات بعد. اضغط «إضافة مقرّر»." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-[13.5px]">
              <thead>
                <tr className="border-b border-black/5 text-[12px] text-ink-soft">
                  <th className="px-4 py-3 font-bold">المقرّر</th>
                  <th className="px-4 py-3 font-bold">المرحلة</th>
                  <th className="px-4 py-3 font-bold">المحاضر</th>
                  <th className="px-4 py-3 font-bold">المحتوى</th>
                  <th className="px-4 py-3 font-bold">الطلاب</th>
                  <th className="px-4 py-3 font-bold">الحالة</th>
                  <th className="px-4 py-3 font-bold">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((c) => {
                  const lessons = c.modules.reduce((n, m) => n + m._count.lessons, 0);
                  return (
                    <tr key={c.id} className="border-b border-black/5 last:border-0 hover:bg-cream-50">
                      <td className="px-4 py-3">
                        <div className="font-bold text-navy-900">{c.titleAr}</div>
                        <div className="text-[12px] text-ink-soft" dir="ltr">{c.titleEn}</div>
                      </td>
                      <td className="px-4 py-3 text-navy-800">{c.stage?.titleAr ?? "—"}</td>
                      <td className="px-4 py-3 text-navy-800">{c.instructor?.nameAr ?? "—"}</td>
                      <td className="px-4 py-3 text-ink-soft">
                        {c.modules.length === 0 ? (
                          <Badge tone="red">لا محتوى</Badge>
                        ) : (
                          <span>
                            {c.modules.length} وحدة · {lessons} درسًا
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-ink-soft">{c._count.enrollments}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1">
                          {c.published ? <Badge tone="green">منشور</Badge> : <Badge tone="gray">مسوّدة</Badge>}
                          {c.visible ? <Badge tone="blue">ظاهر</Badge> : <Badge tone="gray">مخفي</Badge>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/admin/courses/${c.id}/content`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 px-2.5 py-1.5 text-[12px] font-bold text-navy-800 hover:border-gold/50"
                            title="الوحدات والدروس"
                          >
                            <ListTree size={15} /> المحتوى
                          </Link>
                          <Link
                            href={`/admin/courses/${c.id}`}
                            className="grid h-9 w-9 place-items-center rounded-lg text-navy-700 hover:bg-black/5"
                            title="تعديل بيانات المقرّر"
                          >
                            <Pencil size={16} />
                          </Link>
                          <DeleteButton
                            action={deleteRecord.bind(null, "courses", c.id)}
                            confirm="حذف المقرّر يحذف وحداته ودروسه وتسجيلات طلابه. هل أنت متأكد؟"
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
      </Card>
    </div>
  );
}
