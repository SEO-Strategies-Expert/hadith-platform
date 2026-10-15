"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Heading2, Image as ImageIcon, List, Loader2, Type, Upload } from "lucide-react";
import { mediaUrl } from "@/lib/site-format";

type EditableText = { id: number; value: string; kind: "heading" | "paragraph" | "list" | "text" };
type EditableImage = { id: number; src: string; label: string };

function textKind(element: Element | null): EditableText["kind"] {
  const tag = element?.tagName ?? "";
  if (/^H[1-6]$/.test(tag)) return "heading";
  if (tag === "LI") return "list";
  if (["P", "BLOCKQUOTE", "FIGCAPTION"].includes(tag)) return "paragraph";
  return "text";
}

function fieldLabel(item: EditableText, arabic: boolean) {
  const labels = arabic
    ? { heading: "عنوان", paragraph: "فقرة", list: "عنصر قائمة", text: "نص" }
    : { heading: "Heading", paragraph: "Paragraph", list: "List item", text: "Text" };
  return `${labels[item.kind]} ${item.id + 1}`;
}

export function RichTextEditor({ name, label, value, dir = "rtl" }: { name: string; label: string; value?: string | null; dir?: "rtl" | "ltr" }) {
  const source = value ?? "";
  const documentRef = useRef<Document | null>(null);
  const nodesRef = useRef<Text[]>([]);
  const imageNodesRef = useRef<HTMLImageElement[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [html, setHtml] = useState(source);
  const [items, setItems] = useState<EditableText[]>([]);
  const [images, setImages] = useState<EditableImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [uploadingImage, setUploadingImage] = useState<number | null>(null);
  const [imageError, setImageError] = useState("");
  const arabic = dir === "rtl";

  useEffect(() => {
    const parsed = new DOMParser().parseFromString(source, "text/html");
    const walker = parsed.createTreeWalker(parsed.body, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    const nextItems: EditableText[] = [];
    let current: Node | null;
    while ((current = walker.nextNode())) {
      const node = current as Text;
      const parent = node.parentElement;
      if (!parent || parent.closest("script,style,noscript,svg") || !node.nodeValue?.trim()) continue;
      nodes.push(node);
      nextItems.push({ id: nextItems.length, value: node.nodeValue.trim(), kind: textKind(parent.closest("h1,h2,h3,h4,h5,h6,p,li,blockquote,figcaption")) });
    }
    documentRef.current = parsed;
    nodesRef.current = nodes;
    const imageNodes = Array.from(parsed.querySelectorAll("img"));
    imageNodesRef.current = imageNodes;
    setImages(imageNodes.map((image, id) => ({
      id,
      src: image.getAttribute("src") ?? "",
      label: image.getAttribute("alt")?.trim() || image.getAttribute("title")?.trim() || image.closest("figure")?.querySelector("figcaption")?.textContent?.trim() || `صورة ${id + 1}`,
    })));
    setItems(nextItems);
    setHtml(parsed.body.innerHTML);
  }, [source]);

  const change = (id: number, nextValue: string) => {
    const node = nodesRef.current[id];
    const parsed = documentRef.current;
    if (!node || !parsed) return;
    const old = node.nodeValue ?? "";
    const leading = old.match(/^\s*/)?.[0] ?? "";
    const trailing = old.match(/\s*$/)?.[0] ?? "";
    node.nodeValue = `${leading}${nextValue}${trailing}`;
    setItems((current) => current.map((item) => item.id === id ? { ...item, value: nextValue } : item));
    setHtml(parsed.body.innerHTML);
  };

  const changeImage = (id: number, src: string) => {
    const image = imageNodesRef.current[id];
    const parsed = documentRef.current;
    if (!image || !parsed) return;
    if (src.trim()) image.setAttribute("src", src.trim());
    else image.removeAttribute("src");
    setImages((current) => current.map((item) => item.id === id ? { ...item, src } : item));
    setHtml(parsed.body.innerHTML);
  };

  async function uploadImage(id: number, file?: File) {
    if (!file) return;
    setUploadingImage(id);
    setImageError("");
    try {
      const body = new FormData();
      body.set("file", file);
      const response = await fetch("/api/admin/upload", { method: "POST", body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "فشل رفع الصورة.");
      changeImage(id, result.url);
    } catch (error) {
      setImageError(error instanceof Error ? error.message : "تعذّر رفع الصورة.");
    } finally {
      setUploadingImage(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const icons = { heading: Heading2, paragraph: FileText, list: List, text: Type };
  return <div className="block" dir={dir}>
    <input type="hidden" name={name} value={html} />
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><h4 className="text-[14px] font-extrabold text-navy-900">{label}</h4><p className="mt-1 text-[11.5px] text-ink-soft">{arabic ? "عدّل النصوص أو الصور من المعاينات أدناه؛ يبقى تنسيق الصفحة محفوظًا." : "Edit the text and images below; the page layout remains intact."}</p></div><span className="rounded-full bg-navy-50 px-3 py-1 text-[11px] font-bold text-navy-700">{items.length} {arabic ? "حقلًا نصيًا" : "text fields"}</span></div>
    {items.length === 0 ? <div className="rounded-xl border border-dashed border-black/15 bg-slate-50 px-4 py-8 text-center text-[13px] text-ink-soft">{arabic ? "لا يوجد نص قابل للتحرير في هذا المحتوى." : "No editable text was found."}</div> : <div className="grid max-h-[680px] gap-3 overflow-y-auto rounded-2xl border border-black/8 bg-slate-50/70 p-3 sm:grid-cols-2">{items.map((item) => { const Icon = icons[item.kind]; const multiline = item.kind === "paragraph" || item.value.length > 90; const common = "w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-[14px] leading-7 text-navy-950 outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/15"; return <label key={item.id} className={multiline ? "block sm:col-span-2" : "block"}><span className="mb-1.5 flex items-center gap-1.5 text-[11.5px] font-bold text-ink-soft"><Icon size={14} className="text-gold-3" />{fieldLabel(item, arabic)}</span>{multiline ? <textarea rows={Math.min(6, Math.max(2, Math.ceil(item.value.length / 85)))} value={item.value} onChange={(event) => change(item.id, event.target.value)} className={common} /> : <input type="text" value={item.value} onChange={(event) => change(item.id, event.target.value)} className={common} />}</label>; })}</div>}
    {images.length > 0 && <section className="mt-5 rounded-2xl border border-black/8 bg-white p-3 sm:p-4">
      <div className="mb-3 flex items-center gap-2"><ImageIcon size={17} className="text-gold-3" /><div><h5 className="text-[13px] font-extrabold text-navy-900">صور هذا المحتوى</h5><p className="text-[11px] text-ink-soft">معاينة الصور الموجودة في الصفحة؛ غيّر الصورة التي تريدها فقط.</p></div></div>
      <div className="grid gap-3 sm:grid-cols-2">{images.map((image) => <div key={image.id} className="flex min-w-0 gap-3 rounded-xl border border-black/8 bg-slate-50 p-2.5">
        <div className="grid h-20 w-28 shrink-0 place-items-center overflow-hidden rounded-lg border border-black/10 bg-white text-[11px] text-ink-soft">{image.src.trim() ? <img src={mediaUrl(image.src)} alt={image.label} className="h-full w-full object-contain" /> : "بلا صورة"}</div>
        <div className="min-w-0 flex-1"><p className="mb-1 truncate text-[11.5px] font-bold text-navy-800" title={image.label}>{image.label}</p>
          <input type="text" value={image.src} onChange={(event) => changeImage(image.id, event.target.value)} dir="ltr" aria-label={`رابط ${image.label}`} className="w-full rounded-lg border border-black/10 bg-white px-2 py-1.5 text-[11px] outline-none focus:border-gold" />
          <button type="button" disabled={uploadingImage !== null} onClick={() => { setSelectedImage(image.id); fileRef.current?.click(); }} className="mt-1.5 inline-flex items-center gap-1 rounded-md border border-black/10 bg-white px-2 py-1 text-[10.5px] font-bold text-navy-800 disabled:opacity-60">
            {uploadingImage === image.id ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}{uploadingImage === image.id ? "جارٍ الرفع…" : "اختيار صورة جديدة"}
          </button>
        </div>
      </div>)}</div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (selectedImage != null) void uploadImage(selectedImage, file); }} />
      {imageError && <p role="alert" className="mt-2 text-[11.5px] font-semibold text-red-600">{imageError}</p>}
    </section>}
  </div>;
}
