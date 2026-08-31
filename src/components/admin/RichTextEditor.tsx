"use client";

import { useRef, useState } from "react";
import { Bold, Heading2, Italic, List, ListOrdered, Redo2, Undo2 } from "lucide-react";

export function RichTextEditor({ name, label, value, dir = "rtl" }: { name: string; label: string; value?: string | null; dir?: "rtl" | "ltr" }) {
  const editor = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState(value ?? "");
  const run = (command: string, arg?: string) => {
    editor.current?.focus();
    document.execCommand(command, false, arg);
    setHtml(editor.current?.innerHTML ?? "");
  };
  const buttons = [
    ["bold", "عريض", Bold], ["italic", "مائل", Italic], ["formatBlock", "عنوان", Heading2, "h2"],
    ["insertUnorderedList", "قائمة", List], ["insertOrderedList", "قائمة مرقمة", ListOrdered],
    ["undo", "تراجع", Undo2], ["redo", "إعادة", Redo2],
  ] as const;
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-bold text-navy-900">{label}</span>
      <input type="hidden" name={name} value={html} />
      <div className="overflow-hidden rounded-xl border border-black/10 bg-white focus-within:border-gold focus-within:ring-4 focus-within:ring-gold/15">
        <div className="flex flex-wrap gap-1 border-b border-black/10 bg-slate-50 p-2">
          {buttons.map(([cmd, title, Icon, arg]) => <button key={cmd} type="button" title={title} aria-label={title} onClick={() => run(cmd, arg)} className="grid h-8 w-8 place-items-center rounded-lg text-navy-700 hover:bg-white hover:shadow-sm"><Icon size={16} /></button>)}
        </div>
        <div ref={editor} contentEditable suppressContentEditableWarning dir={dir} onInput={(e) => setHtml(e.currentTarget.innerHTML)} dangerouslySetInnerHTML={{ __html: value ?? "" }} className="min-h-56 px-4 py-3 text-[14px] leading-8 outline-none [&_h2]:text-xl [&_h2]:font-extrabold [&_ol]:list-decimal [&_ol]:pr-6 [&_ul]:list-disc [&_ul]:pr-6" />
      </div>
      <span className="mt-1.5 block text-[11.5px] text-ink-soft">اكتب ونسّق المحتوى مباشرة؛ لن تحتاج إلى التعامل مع أكواد HTML.</span>
    </label>
  );
}
