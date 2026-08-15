/** شريط تقدّم صغير — الرقم وحده يُقرأ ببطء في جدولٍ طويل، فالشريط يسبق العين. */
export function ProgressBar({ pct }: { pct: number }) {
  const value = Math.max(0, Math.min(100, pct));
  return (
    <div className="flex min-w-28 items-center gap-2">
      <div className="h-2 w-full overflow-hidden rounded-full bg-black/10">
        <div
          className="h-full rounded-full bg-gradient-to-l from-gold-1 to-gold-3"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="shrink-0 text-[11.5px] font-bold text-ink-soft">{value}%</span>
    </div>
  );
}
