"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, FileText } from "lucide-react";

/**
 * حقل رابط ملفّ مع زرّ رفع — أخو `ImagePickerField` لكن بلا معاينة صورة.
 * مرفقات الدروس غالبها PDF أو ملفّات تطبيق، فمعاينة الصورة لا معنى لها هنا،
 * ومع ذلك يبقى الحقل نصيًّا فيصلح للصق رابط خارجيّ حين لا يكون الرفع مُفعَّلًا.
 */
export function FilePickerField({
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

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <FileText size={16} className="shrink-0 text-ink-soft" />
          <input
            type="text"
            name={name}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            dir="ltr"
            required={required}
            placeholder="https://… أو ارفع ملفًّا"
            className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-[13px] outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/15"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 bg-white px-3 py-1.5 text-[12px] font-bold text-navy-800 hover:bg-cream-50 disabled:opacity-60"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? "جارٍ الرفع…" : "رفع ملفّ"}
          </button>
          {hint && <span className="text-[11.5px] text-ink-soft">{hint}</span>}
        </div>
        {error && <span className="block text-[11.5px] font-semibold text-red-600">{error}</span>}
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </div>
    </div>
  );
}
