import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronUp, ChevronDown, Pencil, Plus, Paperclip, Eye, EyeOff } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { PageHeader, Card, Badge, EmptyState } from "@/components/admin/ui";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { LESSON_KINDS } from "../../fields";
import { deleteModule, deleteLesson, moveModule, moveLesson } from "../../actions";

/**
 * شجرة محتوى المقرّر: وحدة ← درس ← مرفق.
 *
 * حلّ التداخل: بدل جدول مسطَّح واحد، نُظهر كل وحدة **بطاقةً** فيها جدول دروسها.
 * هكذا يرى المحرّر بنية المقرّر كاملةً في شاشة واحدة (وهو ما يعجز عنه المحرّك
 * العام)، بينما تبقى نماذج الإضافة والتعديل في صفحات مستقلّة بنفس مكوّنات
 * اللوحة. الترتيب بحقل `order` رقمي، مع سهمين يبدّلان العنصر بجاره لأنّ تحرير
 * الأرقام يدويًّا لكل صفّ يُتعب المحرّر ويُحدث تصادمات في الأرقام.
 */

function kindLabel(kind: string): string {
  return LESSON_KINDS.find((k) => k.value === kind)?.label ?? kind;
}

function MoveButton({
  action,
  dir,
}: {
  action: () => Promise<void>;
  dir: "up" | "down";
}) {
  return (
    <form action={action}>
      <button
        type="submit"
        className="grid h-8 w-8 place-items-center rounded-lg text-navy-700 transition hover:bg-black/5"
        title={dir === "up" ? "تقديم" : "تأخير"}
        aria-label={dir === "up" ? "تقديم" : "تأخير"}
      >
        {dir === "up" ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
    </form>
  );
}

export default async function CourseContentPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      modules: {
        orderBy: [{ order: "asc" }, { titleAr: "asc" }],
        include: {
          lessons: {
            orderBy: [{ order: "asc" }, { titleAr: "asc" }],
            include: { _count: { select: { attachments: true } } },
          },
        },
      },
    },
  });
  if (!course) notFound();

  const base = `/admin/courses/${id}/content`;

  return (
    <div>
      <PageHeader
        title="محتوى المقرّر"
        desc={`${course.titleAr} — الوحدات والدروس التي يراها الطالب في بوابته.`}
        action={{ href: `${base}/modules/new`, label: "إضافة وحدة" }}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href="/admin/courses"
          className="rounded-lg border border-black/10 bg-white px-3.5 py-2 text-[12.5px] font-bold text-navy-700 hover:border-gold/50"
        >
          كل المقرّرات ←
        </Link>
        <Link
          href={`/admin/courses/${id}`}
          className="rounded-lg border border-black/10 bg-white px-3.5 py-2 text-[12.5px] font-bold text-navy-700 hover:border-gold/50"
        >
          بيانات المقرّر ←
        </Link>
      </div>

      {course.modules.length === 0 ? (
        <Card>
          <EmptyState label="لا توجد وحدات بعد. ابدأ بإضافة وحدة، ثم أضِف دروسها." />
        </Card>
      ) : (
        <div className="space-y-4">
          {course.modules.map((m) => (
            <Card key={m.id}>
              {/* ترويسة الوحدة */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 px-4 py-3.5">
                <div className="flex items-center gap-3">
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

                <div className="flex items-center gap-1">
                  <MoveButton action={moveModule.bind(null, id, m.id, "up")} dir="up" />
                  <MoveButton action={moveModule.bind(null, id, m.id, "down")} dir="down" />
                  <Link
                    href={`${base}/modules/${m.id}`}
                    className="grid h-9 w-9 place-items-center rounded-lg text-navy-700 hover:bg-black/5"
                    title="تعديل الوحدة"
                  >
                    <Pencil size={16} />
                  </Link>
                  <DeleteButton
                    action={deleteModule.bind(null, id, m.id)}
                    confirm="حذف الوحدة يحذف كل دروسها ومرفقاتها. هل أنت متأكد؟"
                  />
                </div>
              </div>

              {/* دروس الوحدة */}
              {m.lessons.length === 0 ? (
                <div className="px-4 py-6 text-center text-[13px] text-ink-soft">لا دروس في هذه الوحدة بعد.</div>
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
                        <th className="px-4 py-2.5 font-bold">إجراءات</th>
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
                            <Badge tone="gold">{kindLabel(l.kind)}</Badge>
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
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-1">
                              <MoveButton action={moveLesson.bind(null, id, m.id, l.id, "up")} dir="up" />
                              <MoveButton action={moveLesson.bind(null, id, m.id, l.id, "down")} dir="down" />
                              <Link
                                href={`${base}/lessons/${l.id}`}
                                className="grid h-9 w-9 place-items-center rounded-lg text-navy-700 hover:bg-black/5"
                                title="تعديل الدرس"
                              >
                                <Pencil size={16} />
                              </Link>
                              <DeleteButton action={deleteLesson.bind(null, id, l.id)} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="border-t border-black/5 px-4 py-3">
                <Link
                  href={`${base}/modules/${m.id}/lessons/new`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 bg-white px-3 py-1.5 text-[12.5px] font-bold text-navy-800 hover:border-gold/50"
                >
                  <Plus size={15} /> إضافة درس إلى «{m.titleAr}»
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
