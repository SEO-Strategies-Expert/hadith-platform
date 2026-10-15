import Link from "next/link";
import { Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge, EmptyState } from "@/components/admin/ui";

export default async function PagesListPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;
  const [pages, firstSlide] = await Promise.all([
    prisma.page.findMany({ orderBy: { slug: "asc" } }),
    prisma.heroSlide.findFirst({ where: { visible: true }, orderBy: { order: "asc" }, select: { imageAr: true } }),
  ]);

  const imageFor = (page: (typeof pages)[number]) => {
    if (page.slug === "index" && firstSlide?.imageAr) return firstSlide.imageAr;
    if (page.heroImage) return page.heroImage;
    const imageTag = page.bodyHtmlAr?.match(/<img\b[^>]*>/i)?.[0];
    const bodyImage = imageTag?.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1];
    return bodyImage || page.ogImage;
  };

  return (
    <div>
      <PageHeader title="الصفحات والأقسام" desc="تحرير نصوص وعناوين وأوصاف كل صفحة (عربي/إنجليزي)." />
      {saved && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[13px] font-bold text-emerald-700">
          تم حفظ الصفحة بنجاح.
        </div>
      )}
      <Card>
        {pages.length === 0 ? (
          <EmptyState label="لا توجد صفحات. شغّل الترحيل أولًا." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-[13.5px]">
              <thead>
                <tr className="border-b border-black/5 text-[12px] text-ink-soft">
                  <th className="px-4 py-3 font-bold">المعرّف</th>
                  <th className="px-4 py-3 font-bold">العنوان</th>
                  <th className="px-4 py-3 font-bold">معاينة الصورة</th>
                  <th className="px-4 py-3 font-bold">القالب</th>
                  <th className="px-4 py-3 font-bold">الحالة</th>
                  <th className="px-4 py-3 font-bold">تحرير</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((p) => (
                  <tr key={p.id} className="border-b border-black/5 last:border-0 hover:bg-cream-50">
                    <td className="px-4 py-3 text-ink-soft" dir="ltr">{p.slug}</td>
                    <td className="px-4 py-3 font-bold text-navy-900">{p.titleAr}</td>
                    <td className="px-4 py-3">{imageFor(p) ? <img src={imageFor(p)!} alt={`صورة ${p.titleAr}`} className="h-14 w-24 rounded-lg border border-black/10 bg-slate-50 object-contain" /> : <span className="text-[11px] text-ink-soft">لا توجد صورة</span>}</td>
                    <td className="px-4 py-3"><Badge tone="blue">{p.template}</Badge></td>
                    <td className="px-4 py-3">
                      {p.status === "PUBLISHED" ? <Badge tone="green">منشورة</Badge> : <Badge tone="gray">مسودّة</Badge>}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/pages/${p.slug}`} className="grid h-9 w-9 place-items-center rounded-lg text-navy-700 hover:bg-black/5" title="تحرير">
                        <Pencil size={16} />
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
