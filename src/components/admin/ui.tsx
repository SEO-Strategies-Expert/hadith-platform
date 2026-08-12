import Link from "next/link";
import { Plus } from "lucide-react";

export function PageHeader({
  title,
  desc,
  action,
}: {
  title: string;
  desc?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold text-navy-900">{title}</h1>
        {desc && <p className="mt-1 text-[14px] text-ink-soft">{desc}</p>}
      </div>
      {action && (
        <Link
          href={action.href}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-gold-1 to-gold-3 px-4 py-2.5 text-[13.5px] font-extrabold text-navy-950 shadow-md hover:brightness-105"
        >
          <Plus size={17} /> {action.label}
        </Link>
      )}
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-black/5 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = "gray",
}: {
  children: React.ReactNode;
  tone?: "gray" | "green" | "red" | "gold" | "blue";
}) {
  const tones: Record<string, string> = {
    gray: "bg-black/5 text-ink-soft",
    green: "bg-emerald-100 text-emerald-700",
    red: "bg-red-100 text-red-700",
    gold: "bg-gold/15 text-gold-3",
    blue: "bg-sky-100 text-sky-700",
  };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11.5px] font-bold ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required,
  dir,
  placeholder,
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  type?: string;
  required?: boolean;
  dir?: "rtl" | "ltr";
  placeholder?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-bold text-navy-900">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue ?? undefined}
        required={required}
        dir={dir}
        placeholder={placeholder}
        className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-[14px] outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/15"
      />
      {hint && <span className="mt-1 block text-[11.5px] text-ink-soft">{hint}</span>}
    </label>
  );
}

export function TextArea({
  label,
  name,
  defaultValue,
  rows = 4,
  dir,
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  rows?: number;
  dir?: "rtl" | "ltr";
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-bold text-navy-900">{label}</span>
      <textarea
        name={name}
        rows={rows}
        defaultValue={defaultValue ?? undefined}
        dir={dir}
        className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-[14px] leading-7 outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/15"
      />
      {hint && <span className="mt-1 block text-[11.5px] text-ink-soft">{hint}</span>}
    </label>
  );
}

export function Select({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-bold text-navy-900">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-[14px] outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/15"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Checkbox({
  label,
  name,
  defaultChecked,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-2.5">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="h-4.5 w-4.5 rounded border-black/20 text-gold accent-gold-3"
      />
      <span className="text-[13.5px] font-semibold text-navy-800">{label}</span>
    </label>
  );
}

export function SubmitBar({
  cancelHref,
  label = "حفظ",
}: {
  cancelHref: string;
  label?: string;
}) {
  return (
    <div className="flex items-center gap-2.5 border-t border-black/5 pt-5">
      <button
        type="submit"
        className="rounded-xl bg-gradient-to-l from-gold-1 to-gold-3 px-6 py-2.5 text-[14px] font-extrabold text-navy-950 shadow-md hover:brightness-105"
      >
        {label}
      </button>
      <Link
        href={cancelHref}
        className="rounded-xl border border-black/10 px-5 py-2.5 text-[14px] font-bold text-ink-soft hover:bg-black/5"
      >
        إلغاء
      </Link>
    </div>
  );
}

export function HubGrid({
  items,
}: {
  items: { href: string; label: string; desc?: string }[];
}) {
  return (
    <div className="grid max-w-3xl gap-3 sm:grid-cols-2">
      {items.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          className="group rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition hover:border-gold/50 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <b className="text-[15px] font-extrabold text-navy-900">{it.label}</b>
            <span className="text-gold-3 transition group-hover:-translate-x-1">←</span>
          </div>
          {it.desc && <p className="mt-1 text-[12.5px] text-ink-soft">{it.desc}</p>}
        </Link>
      ))}
    </div>
  );
}

export function EmptyState({ label }: { label: string }) {
  return (
    <div className="grid place-items-center px-6 py-16 text-center text-[14px] text-ink-soft">
      {label}
    </div>
  );
}
