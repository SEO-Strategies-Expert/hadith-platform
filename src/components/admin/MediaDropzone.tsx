"use client";

import { useRef, useState } from "react";
import { UploadCloud, X } from "lucide-react";

export function MediaDropzone() {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const choose = (next?: File) => {
    if (!next) return;
    const transfer = new DataTransfer();
    transfer.items.add(next);
    if (input.current) input.current.files = transfer.files;
    if (preview) URL.revokeObjectURL(preview);
    setFile(next);
    setPreview(next.type.startsWith("image/") ? URL.createObjectURL(next) : null);
  };
  const clear = () => {
    if (input.current) input.current.value = "";
    if (preview) URL.revokeObjectURL(preview);
    setFile(null); setPreview(null);
  };
  const size = file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "";

  return <div>
    <input ref={input} type="file" name="file" accept="image/*,video/*,audio/*,application/pdf,text/vtt,.srt" className="sr-only" onChange={e => choose(e.target.files?.[0])} />
    <div onDragEnter={e => { e.preventDefault(); setDragging(true); }} onDragOver={e => e.preventDefault()} onDragLeave={e => { e.preventDefault(); if (e.currentTarget === e.target) setDragging(false); }} onDrop={e => { e.preventDefault(); setDragging(false); choose(e.dataTransfer.files?.[0]); }} onClick={() => !file && input.current?.click()} className={`relative grid min-h-72 place-items-center overflow-hidden rounded-2xl border-2 border-dashed p-6 text-center transition ${dragging ? "border-gold bg-gold/10 ring-4 ring-gold/10" : file ? "border-emerald-300 bg-emerald-50/40" : "cursor-pointer border-navy-800/20 bg-slate-50 hover:border-gold hover:bg-gold/5"}`}>
      {file ? <div><div className="relative mx-auto mb-4 aspect-video w-64 overflow-hidden rounded-xl border bg-white">{preview ? <img src={preview} alt="معاينة" className="h-full w-full object-contain"/> : <div className="grid h-full place-items-center text-navy-800"><UploadCloud size={38}/></div>}<button type="button" onClick={e => { e.stopPropagation(); clear(); }} className="absolute left-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/70 text-white"><X size={16}/></button></div><h3 className="break-all font-extrabold text-navy-900">{file.name}</h3><p className="mt-1 text-sm text-ink-soft">{size}</p></div> : <div><span className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-navy-900 text-gold-1 shadow-lg"><UploadCloud size={30}/></span><h3 className="text-[17px] font-extrabold text-navy-900">اسحب الوسائط وأفلتها هنا</h3><p className="mt-2 text-[13px] text-ink-soft">صور، فيديو، صوت، PDF، VTT أو SRT</p><div className="mt-4 text-xs text-ink-soft">حتى 100MB للفيديو و25MB لبقية الملفات</div></div>}
    </div>
  </div>;
}
