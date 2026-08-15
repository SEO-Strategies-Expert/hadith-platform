import Link from "next/link";
import { notFound } from "next/navigation";
import { Eye, EyeOff, Paperclip, Lock } from "lucide-react";
import {
  requireInstructor,
  getInstructorCourse,
  getCourseStudents,
  ENROLLMENT_LABEL,
  enrollmentTone,
  LESSON_KIND_LABEL,
} from "@/lib/instructor";
import { PageHeader, Card, Badge, EmptyState } from "@/components/admin/ui";
import { formatDateTime } from "@/components/admin/datetime";
import { ProgressBar } from "@/components/instructor/ProgressBar";

/**
 * تفاصيل مقرّر المحاضر: بنيته للاطّلاع، وطلابه بنسب تقدّمهم.
 * لا تحرير هنا بتاتًا — تحرير المحتوى في لوحة الإدارة وحدها.
 */
export default async function InstructorCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await requireInstructor();
  const { id } = await params;

  // بلا ملفّ هيئة لا ملكيّة أصلًا — نعامله كغير موجود لا كـ«ممنوع»،
  // فوجود المقرّر نفسه ليس معلومةً يستحقّها من لا يملكه.
  if (!me.scholarId) notFound();

  // العزل: المعرّف من الرابط **مع** شرط الملكيّة في نفس الاستعلام.
  const [course, students] = await Promise.all([
    getInstructorCourse(me.scholarId, id),
    getCourseStudents(me.scholarId, id),
  ]);
  if (!course) notFound();

  return (
    <div>
      <PageHeader title={course.titleAr} desc={course.summaryAr ?? course.descAr ?? undefined} />

      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href="/instructor/courses"
          className="rounded-lg border border-black/10 bg-white px-3.5 py-2 text-[12.5px] font-bold text-navy-700 hover:border-gold/50"
        >
          كل مقرّراتي ←
        </Link>
        <span className="rounded-lg border border-black/10 bg-white px-3.5 py-2 text-[12.5px] font-bold text-ink-soft">
          المرحلة: {course.stage?.titleAr ?? "—"}
        </span>
        {course.startsOn && (
          <span className="rounded-lg border border-black/10 bg-white px-3.5 py-2 text-[12.5px] font-bold text-ink-soft">
            يبدأ: {formatDateTime(course.startsOn)}
          </span>
        )}
        {course.hours != null && (
          <span className="rounded-lg border border-black/10 bg-white px-3.5 py-2 text-[12.5px] font-bold text-ink-soft">
            {course.hours} ساعة
          </span>
        )}
      </div>

      <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-[12.5px] text-sky-800">
        <Lock size={16} className="mt-0.5 shrink-0" />
        <p className="font-semibold leading-6">
          هذه الشاشة للاطّلاع فقط. لتعديل الوحدات أو الدروس أو تسجيل الطلاب راجع إدارة المنصّة.
        </p>
      </div>

      {/* ---------------- بنية المقرّر ---------------- */}
      <h2 className="mb-3 text-[16px] font-extrabold text-navy-900">وحدات المقرّر ودروسه</h2>
      {course.modules.length === 0 ? (
        <Card>
          <EmptyState label="لا وحدات في هذا المقرّر بعد." />
        </Card>
      ) : (
        <div className="space-y-4">
          {course.modules.map((m) => (
            <Card key={m.id}>
              <div className="flex flex-wrap items-center gap-3 border-b border-black/5 px-4 py-3.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-cream-50 text-[12px] font-extrabold text-navy-800">
                  {m.order}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <b className="text-[15px] font-extrabold text-navy-900">{m.titleAr}</b>
                    {m.visible ? (
                      <Eye size={14} className="text-emerald-600" aria-label="ظاهرة" />
                    ) : (
                      <EyeOff size={14} className="text-ink-soft" aria-label="مخفيّة" />
                    )}
                  </div>
                  <div className="text-[12px] text-ink-soft" dir="ltr">{m.titleEn}</div>
                </div>
              </div>

              {m.lessons.length === 0 ? (
                <div className="px-4 py-6 text-center text-[13px] text-ink-soft">
                  لا دروس في هذه الوحدة بعد.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-[13px]">
                    <thead>
                      <tr className="border-b border-black/5 text-[11.5px] text-ink-soft">
                        <th className="px-4 py-2.5 font-bold">#</th>
                        <th className="px-4 py-2.5 font-bold">الدرس</th>
                        <th className="px-4 py-2.5 font-bold">النوع</th>
                        <th className="px-4 py-2.5 font-bold">المدّة</th>
                        <th className="px-4 py-2.5 font-bold">مرفقات</th>
                        <th className="px-4 py-2.5 font-bold">الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {m.lessons.map((l) => (
                        <tr key={l.id} className="border-b border-black/5 last:border-0 hover:bg-cream-50">
                          <td className="px-4 py-2.5 text-ink-soft">{l.order}</td>
                          <td className="px-4 py-2.5">
                            <div className="font-bold text-navy-900">{l.titleAr}</div>
                            <div className="text-[11.5px] text-ink-soft" dir="ltr">{l.titleEn}</div>
                          </td>
                          <td className="px-4 py-2.5">
                            <Badge tone="gold">{LESSON_KIND_LABEL[l.kind] ?? l.kind}</Badge>
                          </td>
                          <td className="px-4 py-2.5 text-ink-soft">
                            {l.durationMin ? `${l.durationMin} د` : "—"}
                          </td>
                          <td className="px-4 py-2.5 text-ink-soft">
                            {l._count.attachments > 0 ? (
                              <span className="inline-flex items-center gap-1">
                                <Paperclip size={13} /> {l._count.attachments}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex flex-wrap items-center gap-1">
                              {l.visible ? <Badge tone="green">ظاهر</Badge> : <Badge tone="gray">مخفي</Badge>}
                              {l.freePreview && <Badge tone="blue">معاينة مجّانيّة</Badge>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* ---------------- طلاب المقرّر ---------------- */}
      <h2 className="mb-3 mt-8 text-[16px] font-extrabold text-navy-900">
        طلاب المقرّر ({students.length})
      </h2>
      <Card>
        {students.length === 0 ? (
          <EmptyState label="لا طلاب مسجَّلين في هذا المقرّر بعد." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-[13.5px]">
              <thead>
                <tr className="border-b border-black/5 text-[12px] text-ink-soft">
                  <th className="px-4 py-3 font-bold">الطالب</th>
                  <th className="px-4 py-3 font-bold">الرقم الجامعي</th>
                  <th className="px-4 py-3 font-bold">التقدّم</th>
                  <th className="px-4 py-3 font-bold">حالة التسجيل</th>
                  <th className="px-4 py-3 font-bold">تاريخ التسجيل</th>
                </tr>
              </thead>
              <tbody>
                {students.map((e) => (
                  <tr key={e.id} className="border-b border-black/5 last:border-0 hover:bg-cream-50">
                    <td className="px-4 py-3">
                      <div className="font-bold text-navy-900">{e.user.name}</div>
                      <div className="text-[12px] text-ink-soft" dir="ltr">{e.user.email}</div>
                    </td>
                    <td className="px-4 py-3 text-ink-soft" dir="ltr">{e.user.studentNo ?? "—"}</td>
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
