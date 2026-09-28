"use client";

import { useEffect } from "react";

export function AutoTranslate() {
  useEffect(() => {
    const onBlur = async (event: FocusEvent) => {
      const source = event.target as HTMLInputElement | HTMLTextAreaElement;
      if (!source?.name?.endsWith("Ar") || !source.value.trim()) return;
      const target = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${source.name.slice(0, -2)}En"]`);
      if (!target || target.value.trim()) return;
      target.dataset.translating = "true";
      try {
        const response = await fetch("/api/admin/translate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: source.value }) });
        const data = await response.json();
        if (response.ok && data.translation) {
          target.value = data.translation;
          target.dispatchEvent(new Event("input", { bubbles: true }));
        } else if (data.error) target.title = data.error;
      } finally { delete target.dataset.translating; }
    };
    document.addEventListener("focusout", onBlur);
    return () => document.removeEventListener("focusout", onBlur);
  }, []);
  return <style>{`[data-translating="true"]{background-image:linear-gradient(90deg,transparent 35%,rgba(217,161,46,.35) 50%,transparent 65%);background-size:200% 100%;animation:autoTranslate 1s linear infinite}@keyframes autoTranslate{to{background-position:-200% 0}}`}</style>;
}
