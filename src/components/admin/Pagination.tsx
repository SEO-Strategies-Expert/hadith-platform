import Link from "next/link";

export function Pagination({ basePath, page, total, pageSize = 25, filters = {}, pageParam = "page" }: {
  basePath: string; page: number; total: number; pageSize?: number;
  filters?: Record<string, string>; pageParam?: string;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const href = (target: number) => {
    const params = new URLSearchParams(filters);
    params.set(pageParam, String(target));
    return `${basePath}?${params}`;
  };
  const visible = Array.from(new Set([1, pages, ...Array.from({ length: 5 }, (_, index) => page - 2 + index)]))
    .filter(value => value >= 1 && value <= pages).sort((a, b) => a - b);
  const style = "rounded-lg border px-3 py-2 text-[12px] font-bold text-navy-800 hover:border-gold";
  return <nav aria-label="التنقل بين الصفحات" className="flex flex-wrap items-center justify-between gap-3 border-t border-black/5 px-4 py-3">
    <p className="text-[12px] text-ink-soft">{total ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, total)} من {total} — صفحة {page} من {pages}</p>
    {pages > 1 && <div className="flex flex-wrap items-center gap-1.5">
      {page > 1 && <Link href={href(page - 1)} className={`${style} border-black/10 bg-white`}>السابق</Link>}
      {visible.map((number, index) => <span key={number} className="flex items-center gap-1.5">
        {index > 0 && number - visible[index - 1] > 1 && <span className="px-1 text-ink-soft">…</span>}
        <Link href={href(number)} aria-current={page === number ? "page" : undefined} className={`${style} ${page === number ? "border-gold bg-gold/15" : "border-black/10 bg-white"}`}>{number}</Link>
      </span>)}
      {page < pages && <Link href={href(page + 1)} className={`${style} border-black/10 bg-white`}>التالي</Link>}
    </div>}
  </nav>;
}
