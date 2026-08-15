import Link from "next/link";
import { Lock } from "lucide-react";
import {
  requireInstructor,
  getInstructorStudents,
  ENROLLMENT_LABEL,
  enrollmentTone,
} from "@/lib/instructor";
import { PageHeader, Card, Badge, EmptyState } from "@/components/admin/ui";
import { formatDateTime } from "@/components/admin/datetime";
import { NoScholarNotice } from "@/components/instructor/NoScholarNotice";
import { ProgressBar } from "@/components/instructor/ProgressBar";

export default async function InstructorStudentsPage() {
  const me = await requireInstructor();

  if (!me.scholarId) {
    return (
      <div>
        <PageHeader title="طلابي" />
        <NoScholarNotice />
      </div>
    );
  }

  // العزل: `course.instructorId = scholarId` داخل الاستعلام — الصفّ الواحد
  // تسجيلٌ في مقرّرٍ للمحاضر، لا «طالب» مطلقًا. فمن سجّل عند غيره لا يظهر منه شيء.
  const rows = await getInstructorStudents(me.scholarId);
  const uniqueStudents = new Set(rows.map((r) => r.user.id)).size;

  return (
    <div>
      <PageHeader
        title="طلابي"
        desc={`${uniqueStudents} طالبًا في ${rows.length} تسجيلًا عبر مقرّراتك. للاطّلاع فقط.`}
      />

      <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-[12.5px] text-sky-800">
        <Lock size={16} className="mt-0.5 shrink-0" />
        <p className="font-semibold leading-6">
          تعديل التسجيل أو حالته من صلاحيّات الإدارة. راجعها لأي تغيير على قيود الطلاب.
        </p>
      </div>

      <Card>
        {rows.length === 0 ? (
          <EmptyState label="لا طلاب مسجَّلين في مقرّراتك بعد." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-[13.5px]">
              <thead>
                <tr className="border-b border-black/5 text-[12px] text-ink-soft">
                  <th className="px-4 py-3 font-bold">الطالب</th>
                  <th className="px-4 py-3 font-bold">الرقم الجامعي</th>
                  <th className="px-4 py-3 font-bold">المقرّر</th>
                  <th className="px-4 py-3 font-bold">التقدّم</th>
                  <th className="px-4 py-3 font-bold">حالة التسجيل</th>
                  <th className="px-4 py-3 font-bold">تاريخ التسجيل</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => (
                  <tr key={e.id} className="border-b border-black/5 last:border-0 hover:bg-cream-50">
                    <td className="px-4 py-3">
                      <div className="font-bold text-navy-900">{e.user.name}</div>
                      <div className="text-[12px] text-ink-soft" dir="ltr">{e.user.email}</div>
                    </td>
                    <td className="px-4 py-3 text-ink-soft" dir="ltr">{e.user.studentNo ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/instructor/courses/${e.course.id}`}
                        className="font-bold text-navy-800 hover:text-gold-3"
                      >
                        {e.course.titleAr}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <ProgressBar pct={e.progressPct} />
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={enrollmentTone(e.status)}>
                        {ENROLLMENT_LABEL[e.status] ?? e.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{formatDateTime(e.enrolledAt)}</td>
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
