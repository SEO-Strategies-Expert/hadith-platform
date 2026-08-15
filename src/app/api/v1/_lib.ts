// أدوات مشتركة لمسارات API التطبيق: ردود موحّدة الشكل ومعالجة أخطاء واحدة.
import { NextResponse } from "next/server";
import { ApiError } from "@/lib/api-auth";

export const ok = <T>(data: T, init?: ResponseInit) => NextResponse.json({ data }, init);

/** يحوّل أي استثناء إلى ردٍّ صالح — ولا يسرّب تفاصيل داخليّة للعميل. */
export function fail(e: unknown) {
  if (e instanceof ApiError) {
    return NextResponse.json({ error: e.message }, { status: e.status });
  }
  console.error("[api/v1]", e);
  return NextResponse.json({ error: "خطأ داخلي" }, { status: 500 });
}

/** يقرأ جسم JSON بأمان — جسمٌ فاسد لا يجب أن يُسقط المسار بـ500. */
export async function body<T = Record<string, unknown>>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    return {} as T;
  }
}
