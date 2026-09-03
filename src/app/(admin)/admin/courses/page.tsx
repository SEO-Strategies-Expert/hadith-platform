import Link from "next/link";
import { Eye, Pencil, ListTree, Search, X, Bug, AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { PageHeader, Card, Badge, EmptyState } from "@/components/admin/ui";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { deleteRecord } from "@/lib/crud-actions";
import { isDebugEnabled } from "@/lib/debug";

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

  let total = 0;
  // Type with includes — use any to avoid Prisma GetPayload complexity in catch block
  let courses: Array<{
    id: string;
    titleAr: string;
    titleEn: string;
    stage: { titleAr: string } | null;
    instructor: { nameAr: string } | null;
    modules: Array<{ _count: { lessons: number } }>;
    _count: { enrollments: number };
    published: boolean;
    visible: boolean;
    order: number;
  }> = [];
  let loadError: { message: string; stack?: string; code?: string } | null = null;

  try {
    const [c, rows] = await Promise.all([
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
    total = c;
    courses = rows;
  } catch (e: unknown) {
    const err = e as Error & { code?: string; meta?: unknown };
    loadError = {
      message: err?.message ?? String(e),
      stack: err?.stack?.slice(0, 4000),
      code: err?.code,
    };
  }

  const debug = await isDebugEnabled();
  if (loadError) {
    const isMissingTable =
      /does not exist|relation.*does not exist|P2021|P2010|column.*does not exist|Cannot read properties/i.test(
        loadError.message
      );
    return (
      <div>
        <PageHeader
          title="المقرّرات الدراسية"
          desc="بيانات المقرّر ومحتواه العلمي."
          action={{ href: "/admin/courses/new", label: "إضافة مقرّر" }}
        />
        <Card className="p-6">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-600 text-white">
              <AlertTriangle size={20} />
            </div>
            <div className="flex-1">
              <h2 className="text-[16px] font-extrabold text-red-700">تعذّر تحميل المقرّرات (500)</h2>
              <p className="mt-1 text-[13px] leading-6 text-ink-soft">
                فشل الاستعلام عن جدول <code dir="ltr">courses</code>. السبب الأكثر شيوعًا هو عدم مزامنة هيكل قاعدة
                البيانات بعد نشر جديد على Vercel/Neon.
              </p>
              {!debug ? (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] leading-6 text-amber-900">
                  <span className="font-bold">وضع التصحيح متوقّف.</span> فعّله لرؤية رسالة الخطأ الكاملة وتتبّع المكدّس:
                  <Link
                    href="/admin/settings"
                    className="mr-2 inline-flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1 text-[12px] font-bold text-white hover:bg-amber-700"
                  >
                    <Bug size={12} /> الإعدادات ← تفعيل Debug
                  </Link>
                  <span className="block mt-1 text-[11.5px]">
                    أو اذهب مباشرةً إلى <Link href="/admin/system" className="font-bold underline">/admin/system ← مزامنة الهيكل الآن</Link> لإصلاح قاعدة Neon.
                  </span>
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                    <div className="text-[12px] font-bold text-red-700">رسالة الخطأ (Debug ON):</div>
                    <pre
                      dir="ltr"
                      className="mt-1 overflow-auto whitespace-pre-wrap break-all rounded bg-white p-3 text-[11.5px] leading-5 text-red-800"
                    >
                      {loadError.code ? `code: ${loadError.code}\n` : ""}
                      {loadError.message}
                    </pre>
                    {loadError.stack && (
                      <pre
                        dir="ltr"
                        className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-all rounded bg-black/5 p-3 text-[10.5px] leading-4 text-ink-soft"
                      >
                        {loadError.stack}
                      </pre>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href="/admin/system"
                      className="rounded-xl bg-navy-900 px-4 py-2 text-[13px] font-bold text-white hover:bg-black"
                    >
                      مزامنة الهيكل في /admin/system ←
                    </Link>
                    <Link
                      href="/admin/settings"
                      className="rounded-xl border border-black/10 bg-white px-4 py-2 text-[13px] font-bold text-navy-700 hover:border-gold/50"
                    >
                      إيقاف Debug
                    </Link>
                    <a href="/admin/courses" className="rounded-xl border px-4 py-2 text-[13px] font-bold">
                      إعادة المحاولة
                    </a>
                  </div>
                </div>
              )}
              {isMissingTable && (
                <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-[12px] font-bold text-amber-900">
                  تشخيص سريع: يبدو أن جدول <code dir="ltr">courses</code> أو أحد أعمدته غير موجود في Neon (
                  <code dir="ltr">ep-noisy-mode-av88xqhy-pooler.c-11.us-east-1.aws.neon.tech</code>). شغّل
                  <code dir="ltr"> prisma db push</code> من <Link href="/admin/system" className="underline">/admin/system</Link>.
                </div>
              )}
              {debug && (
                <div className="mt-3 text-[11.5px] text-ink-soft">
                  where: <code dir="ltr" className="break-all">{JSON.stringify(where)}</code> · page {page} · q=
                  <code dir="ltr">{q ?? "—"}</code>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  }

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
