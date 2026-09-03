import Link from "next/link";
import { Eye, Pencil, ListTree, Search, X } from "lucide-react";
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
const COURSES_PER_PAGE = 20;

function buildPageHref(page: number, q: string | undefined) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/admin/courses?${qs}` : "/admin/courses";
}

function Pagination({
  page,
  totalPages,
  q,
}: {
  page: number;
  totalPages: number;
  q?: string;
}) {
  if (totalPages <= 1) return null;
  const pages: (number | "...")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/5 px-4 py-3 text-[13px]">
      <span className="text-ink-soft">
        صفحة {page} من {totalPages}
      </span>
      <div className="flex flex-wrap items-center gap-1.5">
        <Link
          href={page > 1 ? buildPageHref(page - 1, q) : "#"}
          aria-disabled={page <= 1}
          className={`rounded-lg border px-3 py-1.5 font-bold ${page <= 1 ? "pointer-events-none border-black/5 bg-black/[0.02] text-ink-soft/40" : "border-black/10 bg-white text-navy-700 hover:border-gold/50"}`}
        >
          السابق
        </Link>
        {pages.map((p, idx) =>
          p === "..." ? (
            <span key={`ellipsis-${idx}`} className="px-1 text-ink-soft">
              …
            </span>
          ) : (
            <Link
              key={p}
              href={buildPageHref(p as number, q)}
              className={`min-w-[36px] rounded-lg border px-3 py-1.5 text-center font-bold ${p === page ? "border-gold bg-gold/15 text-navy-900" : "border-black/10 bg-white text-navy-700 hover:border-gold/50"}`}
            >
              {p}
            </Link>
          )
        )}
        <Link
          href={page < totalPages ? buildPageHref(page + 1, q) : "#"}
          aria-disabled={page >= totalPages}
          className={`rounded-lg border px-3 py-1.5 font-bold ${page >= totalPages ? "pointer-events-none border-black/5 bg-black/[0.02] text-ink-soft/40" : "border-black/10 bg-white text-navy-700 hover:border-gold/50"}`}
        >
          التالي
        </Link>
      </div>
    </div>
  );
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; q?: string }>;
}) {
  await requireUser();

  const sp = await searchParams;
  const rawPage = Number.parseInt(sp?.page ?? "1", 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const q = sp?.q?.trim() ? sp.q.trim() : undefined;
  const skip = (page - 1) * COURSES_PER_PAGE;

  const where = q
    ? {
        OR: [
          { titleAr: { contains: q, mode: "insensitive" as const } },
          { titleEn: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [total, courses] = await Promise.all([
    prisma.course.count({ where }),
    prisma.course.findMany({
      where,
      orderBy: [{ order: "asc" }, { titleAr: "asc" }],
      skip,
      take: COURSES_PER_PAGE,
      include: {
        stage: { select: { titleAr: true } },
        instructor: { select: { nameAr: true } },
        _count: { select: { enrollments: true } },
        modules: { select: { _count: { select: { lessons: true } } } },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / COURSES_PER_PAGE));

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

      <form method="get" className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex min-w-[260px] flex-1 max-w-md items-center">
          <Search size={16} className="pointer-events-none absolute right-3 text-ink-soft" />
          <input
            type="text"
            name="q"
            defaultValue={q ?? ""}
            placeholder="بحث باسم المقرّر (عربي / إنجليزي)…"
            className="w-full rounded-xl border border-black/10 bg-white py-2.5 pr-10 pl-3 text-[13.5px] outline-none placeholder:text-ink-soft/60 focus:border-gold focus:ring-4 focus:ring-gold/15"
          />
        </div>
        <button
          type="submit"
          className="rounded-xl border border-black/10 bg-white px-5 py-2.5 text-[13px] font-bold text-navy-800 hover:border-gold/50"
        >
          بحث
        </button>
        {q && (
          <Link
            href="/admin/courses"
            className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-[13px] font-bold text-ink-soft hover:bg-black/5"
          >
            <X size={14} />
            مسح
          </Link>
        )}
        {q && (
          <span className="text-[12.5px] text-ink-soft">
            {total} نتيجة لـ “{q}”
          </span>
        )}
      </form>

      <Card>
        {total === 0 ? (
          <EmptyState label={q ? `لا توجد مقرّرات مطابقة لـ “${q}”.` : "لا توجد مقرّرات بعد. اضغط «إضافة مقرّر»."} />
        ) : courses.length === 0 ? (
          <>
            <EmptyState label="لا توجد نتائج في هذه الصفحة." />
            <Pagination page={page} totalPages={totalPages} q={q} />
          </>
        ) : (
          <>
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
                      <td className="px-4 py-3 text-ink-soft"><Link href={`/admin/enrollments?courseId=${c.id}`} className="font-bold text-navy-700 underline decoration-gold/60 underline-offset-4" title="عرض طلاب المقرر">{c._count.enrollments} طالب ←</Link></td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1">
                          {c.published ? <Badge tone="green">منشور</Badge> : <Badge tone="gray">مسوّدة</Badge>}
                          {c.visible ? <Badge tone="blue">ظاهر</Badge> : <Badge tone="gray">مخفي</Badge>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/student/course/${c.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gold/40 bg-gold/5 px-2.5 py-1.5 text-[12px] font-bold text-navy-800 hover:bg-gold/10"
                            title="معاينة المقرّر كما يراه الطالب الملتحق"
                          >
                            <Eye size={15} /> معاينة الطالب
                          </Link>
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
            <Pagination page={page} totalPages={totalPages} q={q} />
          </>
        )}
      </Card>
    </div>
  );
}
