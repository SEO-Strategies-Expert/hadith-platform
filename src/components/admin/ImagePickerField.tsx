"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, X } from "lucide-react";

export function ImagePickerField({
  label,
  name,
  defaultValue,
  required,
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  required?: boolean;
  hint?: string;
}) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل الرفع");
      setUrl(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر الرفع.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div>
      <span className="mb-1.5 block text-[13px] font-bold text-navy-900">
        {label} {required && <span className="text-red-500">*</span>}
      </span>

      <div className="flex items-start gap-3">
        {url ? (
          <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg border border-black/10 bg-cream-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => setUrl("")}
              className="absolute left-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
              title="إزالة"
            >
              <X size={13} />
            </button>
          </div>
        ) : (
          <div className="grid h-20 w-28 shrink-0 place-items-center rounded-lg border border-dashed border-black/15 bg-cream-50 text-[11px] text-ink-soft">
            بلا صورة
          </div>
        )}

        <div className="flex-1 space-y-2">
          <input
            type="text"
            name={name}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            dir="ltr"
            placeholder="/assets/img/... أو ارفع ملفًّا"
            className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-[13px] outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/15"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 bg-white px-3 py-1.5 text-[12px] font-bold text-navy-800 hover:bg-cream-50 disabled:opacity-60"
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {uploading ? "جارٍ الرفع…" : "رفع صورة"}
            </button>
            {hint && <span className="text-[11.5px] text-ink-soft">{hint}</span>}
          </div>
          {error && <span className="block text-[11.5px] font-semibold text-red-600">{error}</span>}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </div>
      </div>
    </div>
  );
}
