"use client";

import { useActionState } from "react";
import type { Lang } from "@/lib/site-data";

/**
 * نموذج تسليم الواجب.
 *
 * مكوّن عميل لسببٍ واحد: إظهار رسالة الخطأ العائدة من الإجراء في مكانها بدل
 * صفحة خطأ. الحفظ نفسه كلّه على الخادم — والزرّان يفترقان بحقل `intent` لا
 * بمنطقٍ في المتصفّح، فيعملان حتى لو لم يُحمَّل هذا الـJavaScript.
 *
 * **لا رفع ملفّات هنا**: مسار `/api/admin/upload` يشترط دور ADMIN أو EDITOR
 * ويرفض جلسة الطالب، فنكتفي برابطٍ خارجيّ يلصقه الطالب حتى يُفتح مسار رفعٍ له.
 */

type Action = (prev: string | undefined, formData: FormData) => Promise<string | undefined>;

const T = {
  ar: {
    text: "نصّ الواجب",
    textHint: "اكتب إجابتك هنا، أو الصق رابط ملفّك أدناه، أو كليهما.",
    fileUrl: "رابط الملفّ (اختياري)",
    fileUrlHint: "رابط عامّ لملفّك على Google Drive أو OneDrive أو غيرهما — يبدأ بـ https://",
    fileName: "اسم الملفّ (اختياري)",
    saveDraft: "احفظ مسوّدة",
    submit: "سلّم الواجب",
    saving: "جارٍ الحفظ…",
    submitNote: "المسوّدة تُحفظ لك وحدك؛ ولا يراها المصحِّح مسلَّمةً حتى تضغط «سلّم الواجب».",
  },
  en: {
    text: "Your answer",
    textHint: "Write your answer here, paste a link to your file below, or both.",
    fileUrl: "File link (optional)",
    fileUrlHint: "A public link to your file on Google Drive, OneDrive, etc. — must start with https://",
    fileName: "File name (optional)",
    saveDraft: "Save draft",
    submit: "Submit assignment",
    saving: "Saving…",
    submitNote: "A draft is kept for you only; it is not treated as submitted until you press Submit.",
  },
} as const;

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 12,
  border: "1px solid rgba(18,49,89,.18)",
  padding: "10px 14px",
  fontSize: 14.5,
  lineHeight: 1.9,
  background: "#fff",
  fontFamily: "inherit",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontWeight: 800,
  fontSize: 13,
  marginBottom: 6,
  color: "#123159",
};

const hintStyle: React.CSSProperties = { fontSize: 12, color: "#5c6b80", marginTop: 5 };

export function StudentAssignmentForm({
  action,
  lang,
  defaults,
}: {
  action: Action;
  lang: Lang;
  defaults: { text: string | null; fileUrl: string | null; fileName: string | null };
}) {
  const t = T[lang];
  const [error, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} style={{ display: "grid", gap: 18 }}>
      <label style={{ display: "block" }}>
        <span style={labelStyle}>{t.text}</span>
        <textarea
          name="text"
          rows={9}
          dir="auto"
          defaultValue={defaults.text ?? ""}
          style={inputStyle}
        />
        <span style={hintStyle}>{t.textHint}</span>
      </label>

      <label style={{ display: "block" }}>
        <span style={labelStyle}>{t.fileUrl}</span>
        <input name="fileUrl" dir="ltr" defaultValue={defaults.fileUrl ?? ""} style={inputStyle} />
        <span style={hintStyle}>{t.fileUrlHint}</span>
      </label>

      <label style={{ display: "block" }}>
        <span style={labelStyle}>{t.fileName}</span>
        <input name="fileName" dir="auto" defaultValue={defaults.fileName ?? ""} style={inputStyle} />
      </label>

      {error && (
        <p
          role="alert"
          style={{
            borderRadius: 12,
            border: "1px solid rgba(190,30,30,.35)",
            background: "rgba(190,30,30,.07)",
            color: "#8a2b2b",
            fontWeight: 800,
            padding: "10px 16px",
            lineHeight: 1.9,
          }}
        >
          {error}
        </p>
      )}

      <p style={hintStyle}>{t.submitNote}</p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        {/* الزرّان يرسلان `intent` مختلفًا — يفرّق بينهما الخادم لا المتصفّح. */}
        <button className="btn btn-gold" type="submit" name="intent" value="submit" disabled={pending}>
          {pending ? t.saving : t.submit}
        </button>
        <button
          className="btn btn-outline-ink"
          type="submit"
          name="intent"
          value="draft"
          disabled={pending}
        >
          {t.saveDraft}
        </button>
      </div>
    </form>
  );
}
