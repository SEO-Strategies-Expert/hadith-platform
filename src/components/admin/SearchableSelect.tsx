"use client";

import { useMemo, useState } from "react";

type Option = { value: string; label: string };

export function SearchableSelect({ label, name, options, placeholder = "ابحث واختر…", required = false, defaultValue = "" }: {
  label: string; name: string; options: Option[]; placeholder?: string; required?: boolean; defaultValue?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return needle ? options.filter((option) => option.label.toLocaleLowerCase().includes(needle)) : options;
  }, [options, query]);

  return (
    <div className="relative">
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-bold text-navy-900">{label} {required && <span className="text-red-500">*</span>}</span>
        <input type="hidden" name={name} value={value} required={required} />
        <input type="text" value={open ? query : selected?.label ?? ""} placeholder={placeholder}
          onFocus={() => { setOpen(true); setQuery(""); }}
          onChange={(event) => { setQuery(event.target.value); setOpen(true); setValue(""); }}
          onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }}
          className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-[14px] outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/15"
          role="combobox" aria-expanded={open} aria-autocomplete="list" />
      </label>
      {open && <>
        <button type="button" aria-label="إغلاق قائمة الخيارات" className="fixed inset-0 z-10 cursor-default" onClick={() => setOpen(false)} />
        <div className="absolute inset-x-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-xl border border-black/10 bg-white p-1 shadow-xl">
          {filtered.length ? filtered.map((option) => <button key={option.value || "empty"} type="button"
            className="block w-full rounded-lg px-3 py-2 text-right text-[13px] text-navy-800 hover:bg-cream-50"
            onClick={() => { setValue(option.value); setQuery(""); setOpen(false); }}>{option.label}</button>)
            : <div className="px-3 py-3 text-[12px] text-ink-soft">لا توجد نتائج مطابقة.</div>}
        </div>
      </>}
      {!value && !open && <span className="mt-1 block text-[11px] text-ink-soft">ابدأ بكتابة اسم المقرّر للبحث.</span>}
    </div>
  );
}
