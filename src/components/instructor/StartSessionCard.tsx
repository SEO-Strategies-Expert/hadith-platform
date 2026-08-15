import { Video, ShieldAlert, LinkIcon } from "lucide-react";

/**
 * أزرار دخول المجلس كما يراها **صاحب المجلس وحده**.
 *
 * `zoomStartUrl` رابط المضيف: من فتحه صار مضيف الاجتماع بلا كلمة مرور. ومكانه
 * الطبيعي هنا لا في بوابة الطالب. الاستدعاء مسؤول عن ألّا يمرّره إلّا بعد
 * التأكّد من ملكيّة المجلس — والتحذير المرافق مقصود: الرابط يُسرَّب بلصقه في
 * مجموعةٍ لا باختراق.
 */
export function StartSessionCard({
  zoomStartUrl,
  joinUrl,
  passcode,
}: {
  zoomStartUrl: string | null;
  joinUrl: string | null;
  passcode: string | null;
}) {
  if (!zoomStartUrl && !joinUrl) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12.5px] font-semibold text-amber-800">
        لا رابط لهذا المجلس بعد — راجع الإدارة قبل موعده.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {zoomStartUrl && (
          <a
            href={zoomStartUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-gold-1 to-gold-3 px-5 py-2.5 text-[13.5px] font-extrabold text-navy-950 shadow-md hover:brightness-105"
          >
            <Video size={17} /> ابدأ المجلس
          </a>
        )}
        {joinUrl && (
          <a
            href={joinUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-[13px] font-bold text-navy-800 hover:border-gold/50"
          >
            <LinkIcon size={15} /> رابط الطلاب
          </a>
        )}
        {passcode && (
          <span className="rounded-lg bg-black/5 px-3 py-2 text-[12.5px] font-bold text-ink-soft">
            رمز الدخول: <span dir="ltr">{passcode}</span>
          </span>
        )}
      </div>

      {zoomStartUrl && (
        <p className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[12px] font-semibold leading-6 text-red-700">
          <ShieldAlert size={15} className="mt-0.5 shrink-0" />
          زرّ «ابدأ المجلس» يفتح رابط المضيف الخاصّ بك. لا تُشارِكه مع الطلاب ولا تنسخه في أيّ
          مجموعة — من يفتحه يصير مضيفًا للمجلس. رابط الطلاب هو «رابط الطلاب» وحده.
        </p>
      )}
    </div>
  );
}
