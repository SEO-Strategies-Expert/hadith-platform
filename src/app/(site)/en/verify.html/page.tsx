import type { Metadata } from "next";
import { CertificateVerify } from "@/components/site/CertificateVerify";

type SP = Promise<{ code?: string | string[] }>;

function readCode(sp: { code?: string | string[] }): string | undefined {
  const raw = Array.isArray(sp.code) ? sp.code[0] : sp.code;
  return raw?.trim() || undefined;
}

/** نفس حكم النسخة العربيّة: صفحة النتيجة لا تُفهرَس لأنّها تحمل اسمًا. */
export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const hasCode = Boolean(readCode(await searchParams));
  return {
    title:
      "Verify Certificates and Licences | The Higher College of Prophetic Hadith, Sciences, and Studies",
    description:
      "Enter the verification code printed on a certificate or a chained licence (ijāza) to see the record exactly as it is held in the College register.",
    robots: hasCode ? { index: false, follow: false } : undefined,
  };
}

export default async function EnglishVerifyPage({ searchParams }: { searchParams: SP }) {
  const code = readCode(await searchParams);
  return <CertificateVerify lang="en" code={code} />;
}
