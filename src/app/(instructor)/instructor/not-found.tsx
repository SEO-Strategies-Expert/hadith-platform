import Link from "next/link";
import { SearchX } from "lucide-react";

/**
 * ٤٠٤ داخل اللوحة.
 *
 * تصل إليها أيضًا محاولةُ فتح مقرّرٍ أو مجلسٍ ليس للمحاضر — عمدًا: «غير موجود»
 * لا تكشف شيئًا، بينما «ممنوع» تُثبت للمتطفّل أنّ المعرّف صحيح.
 */
export default function InstructorNotFound() {
  return (
    <div className="grid place-items-center px-6 py-24 text-center">
      <SearchX size={38} className="text-ink-soft" />
      <h1 className="mt-4 text-[19px] font-extrabold text-navy-900">الصفحة غير موجودة</h1>
      <p className="mt-2 max-w-md text-[13.5px] leading-7 text-ink-soft">
        الرابط الذي فتحته لا يقابل مقرّرًا أو مجلسًا مسنَدًا إليك.
      </p>
      <Link
        href="/instructor"
        className="mt-6 rounded-xl bg-gradient-to-l from-gold-1 to-gold-3 px-5 py-2.5 text-[13.5px] font-extrabold text-navy-950"
      >
        العودة إلى لوحتي
      </Link>
    </div>
  );
}
