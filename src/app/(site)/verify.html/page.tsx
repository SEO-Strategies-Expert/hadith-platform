import type { Metadata } from "next";
import { CertificateVerify } from "@/components/site/CertificateVerify";

type SP = Promise<{ code?: string | string[] }>;

/** الرمز قد يتكرّر في الرابط؛ نأخذ أوّله ولا نُخفق. */
function readCode(sp: { code?: string | string[] }): string | undefined {
  const raw = Array.isArray(sp.code) ? sp.code[0] : sp.code;
  return raw?.trim() || undefined;
}

/**
 * صفحة النتيجة تحمل اسم صاحب الوثيقة؛ فالرابط المشارَك يُمنع من الفهرسة
 * لئلّا تُجمع أسماء أصحاب الوثائق من محرّكات البحث. أمّا الصفحة بلا رمز
 * فخدمةٌ عامّة تُفهرَس.
 */
export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const hasCode = Boolean(readCode(await searchParams));
  return {
    title: "التحقّق من الشهادات والإجازات | الكلّية العليا للحديث النبوي وعلومه وعِلَلِه",
    description:
      "أدخل رمز التحقّق المدوَّن على الشهادة أو الإجازة المسنَدة ليظهر لك بيانُ الوثيقة كما هو مثبتٌ في سجلّ الكلّية.",
    robots: hasCode ? { index: false, follow: false } : undefined,
  };
}

export default async function ArabicVerifyPage({ searchParams }: { searchParams: SP }) {
  const code = readCode(await searchParams);
  return <CertificateVerify lang="ar" code={code} />;
}
