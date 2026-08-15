import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireInstructor, getInstructorCourses } from "@/lib/instructor";
import { PageHeader, Card, Badge, EmptyState } from "@/components/admin/ui";
import { NoScholarNotice } from "@/components/instructor/NoScholarNotice";

export default async function InstructorCoursesPage() {
  const me = await requireInstructor();

  if (!me.scholarId) {
    return (
      <div>
        <PageHeader title="مقرّراتي" />
        <NoScholarNotice />
      </div>
    );
  }

  // العزل: `getInstructorCourses` تضع `instructorId = scholarId` في الاستعلام.
  const courses = await getInstructorCourses(me.scholarId);

  return (
    <div>
      <PageHeader
        title="مقرّراتي"
        desc="المقرّرات المسنَدة إليك. المحتوى للاطّلاع — تحريره من لوحة الإدارة."
      />

      <Card>
        {courses.length === 0 ? (
          <EmptyState label="لا مقرّرات مسنَدة إليك بعد." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-[13.5px]">
              <thead>
                <tr className="border-b border-black/5 text-[12px] text-ink-soft">
                  <th className="px-4 py-3 font-bold">المقرّر</th>
                  <th className="px-4 py-3 font-bold">المرحلة</th>
                  <th className="px-4 py-3 font-bold">الوحدات</th>
                  <th className="px-4 py-3 font-bold">الطلاب</th>
                  <th className="px-4 py-3 font-bold">المجالس</th>
                  <th className="px-4 py-3 font-bold">الحالة</th>
                  <th className="px-4 py-3 font-bold"></th>
                </tr>
              </thead>
              <tbody>
                {courses.map((c) => (
                  <tr key={c.id} className="border-b border-black/5 last:border-0 hover:bg-cream-50">
                    <td className="px-4 py-3">
                      <div className="font-bold text-navy-900">{c.titleAr}</div>
                      <div className="text-[12px] text-ink-soft" dir="ltr">{c.titleEn}</div>
                    </td>
                    <td className="px-4 py-3 text-navy-800">{c.stage?.titleAr ?? "—"}</td>
                    <td className="px-4 py-3 text-ink-soft">{c._count.modules}</td>
                    <td className="px-4 py-3 text-ink-soft">{c._count.enrollments}</td>
                    <td className="px-4 py-3 text-ink-soft">{c._count.sessions}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1">
                        {c.published ? <Badge tone="green">منشور</Badge> : <Badge tone="gray">غير منشور</Badge>}
                        {!c.visible && <Badge tone="gray">مخفي</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/instructor/courses/${c.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 bg-white px-3 py-1.5 text-[12.5px] font-bold text-navy-800 hover:border-gold/50"
                      >
                        التفاصيل <ArrowLeft size={14} />
                      </Link>
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
