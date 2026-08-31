"use client";

import { useRef, useState } from "react";
import { ImagePlus, UploadCloud, X } from "lucide-react";

export function MediaDropzone() {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const choose = (next?: File) => {
    if (!next) return;
    if (!next.type.startsWith("image/")) return;
    const transfer = new DataTransfer();
    transfer.items.add(next);
    if (input.current) input.current.files = transfer.files;
    if (preview) URL.revokeObjectURL(preview);
    setFile(next);
    setPreview(URL.createObjectURL(next));
  };
  const clear = () => {
    if (input.current) input.current.value = "";
    if (preview) URL.revokeObjectURL(preview);
    setFile(null); setPreview(null);
  };
  const size = file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "";

  return <div>
    <input ref={input} type="file" name="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" className="sr-only" onChange={e => choose(e.target.files?.[0])} />
    <div onDragEnter={e => { e.preventDefault(); setDragging(true); }} onDragOver={e => e.preventDefault()} onDragLeave={e => { e.preventDefault(); if (e.currentTarget === e.target) setDragging(false); }} onDrop={e => { e.preventDefault(); setDragging(false); choose(e.dataTransfer.files?.[0]); }} onClick={() => !file && input.current?.click()} className={`relative grid min-h-72 place-items-center overflow-hidden rounded-2xl border-2 border-dashed p-6 text-center transition ${dragging ? "border-gold bg-gold/10 ring-4 ring-gold/10" : file ? "border-emerald-300 bg-emerald-50/40" : "cursor-pointer border-navy-800/20 bg-slate-50 hover:border-gold hover:bg-gold/5"}`}>
      {preview ? <div className="grid w-full gap-4 sm:grid-cols-[220px_1fr] sm:items-center sm:text-right"><div className="relative mx-auto aspect-video w-full max-w-64 overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm"><img src={preview} alt="معاينة الصورة" className="h-full w-full object-contain"/><button type="button" onClick={e => { e.stopPropagation(); clear(); }} className="absolute left-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/70 text-white hover:bg-black" aria-label="إزالة الصورة"><X size={16}/></button></div><div><div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-[12px] font-bold text-emerald-700"><ImagePlus size={14}/> الصورة جاهزة للرفع</div><h3 className="break-all text-[15px] font-extrabold text-navy-900">{file?.name}</h3><p className="mt-1 text-[12px] text-ink-soft">{size} · يمكنك استبدالها قبل الرفع</p><button type="button" onClick={e => { e.stopPropagation(); input.current?.click(); }} className="mt-4 rounded-xl border border-black/10 bg-white px-4 py-2 text-[12px] font-bold text-navy-800 hover:border-gold">اختيار صورة أخرى</button></div></div> : <div><span className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-navy-900 text-gold-1 shadow-lg"><UploadCloud size={30}/></span><h3 className="text-[17px] font-extrabold text-navy-900">اسحب الصورة وأفلتها هنا</h3><p className="mt-2 text-[13px] text-ink-soft">أو اضغط لاختيارها من جهازك</p><div className="mt-4 flex flex-wrap justify-center gap-2 text-[11px] text-ink-soft"><span className="rounded-full bg-white px-3 py-1 shadow-sm">PNG · JPG · WEBP · GIF · SVG</span><span className="rounded-full bg-white px-3 py-1 shadow-sm">الحد الأقصى 8MB</span></div></div>}
    </div>
  </div>;
}
