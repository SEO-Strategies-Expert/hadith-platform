import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guard";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const { text } = await request.json();
    if (typeof text !== "string" || !text.trim()) return NextResponse.json({ error: "النص فارغ" }, { status: 400 });
    const rows = await prisma.setting.findMany({ where: { key: { in: ["translation.provider", "translation.model", "translation.apiKey"] } } });
    const settings = new Map(rows.map((row) => {
      const value = row.value;
      return [row.key, typeof value === "string" ? value : value == null ? "" : JSON.stringify(value).replace(/^"|"$/g, "")];
    }));
    const key = settings.get("translation.apiKey");
    if (!key) return NextResponse.json({ error: "لم يُضبط مفتاح الترجمة" }, { status: 503 });
    const response = await fetch("https://api.mistral.ai/v1/chat/completions", { method: "POST", headers: { "content-type": "application/json", Authorization: `Bearer ${key}` }, body: JSON.stringify({ model: settings.get("translation.model") || "mistral-small-latest", temperature: 0.2, messages: [{ role: "system", content: "Translate Arabic to clear, natural English. Return only the translation." }, { role: "user", content: text }] }) });
    const data = await response.json();
    if (!response.ok) {
      const providerMessage = typeof data?.message === "string" ? data.message : typeof data?.error === "string" ? data.error : "تحقق من مفتاح API واسم النموذج في الإعدادات.";
      return NextResponse.json({ error: `فشل مزود الترجمة: ${providerMessage}` }, { status: 502 });
    }
    return NextResponse.json({ translation: data.choices?.[0]?.message?.content?.trim() || "" });
  } catch { return NextResponse.json({ error: "تعذّرت الترجمة" }, { status: 500 }); }
}
