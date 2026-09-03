"use client";

import { useTransition } from "react";
import { Database, Loader2, RefreshCw } from "lucide-react";
import Swal from "sweetalert2";
import { Card, Badge } from "@/components/admin/ui";
import { syncDatabase } from "./actions";

export function SyncDatabaseCard({ hasSchemaError }: { hasSchemaError: boolean }) {
  const [pending, startTransition] = useTransition();

  const handleSync = async () => {
    const result = await Swal.fire({
      title: "مزامنة هيكل قاعدة البيانات؟",
      html: `
        <div style="text-align:right;font-size:13px;line-height:1.8">
          سيُشغَّل <code dir="ltr">prisma db push</code> على الخادم.<br/>
          • ينشئ الجداول/الأعمدة الناقصة من <code dir="ltr">schema.prisma</code><br/>
          • لا يحذف بياناتك (يحذف فقط ما حُذف من المخطط نفسه)<br/>
          • يعالج خطأ الإنتاج <b>“This page couldn't load”</b> بعد نشر نسخة جديدة<br/>
          <span style="color:#b45309">يستغرق 10-30 ثانية — لا تغلق الصفحة.</span>
        </div>
      `,
      icon: hasSchemaError ? "warning" : "question",
      showCancelButton: true,
      confirmButtonColor: hasSchemaError ? "#d97706" : "#1a365d",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "نعم، زامن الآن",
      cancelButtonText: "إلغاء",
      reverseButtons: true,
      focusCancel: true,
      customClass: {
        popup: "rounded-2xl",
        confirmButton: "rounded-xl px-5 py-2.5 font-bold",
        cancelButton: "rounded-xl px-5 py-2.5 font-bold",
      },
    });
    if (!result.isConfirmed) return;

    Swal.fire({
      title: "جارٍ المزامنة...",
      text: "يتم تحديث جداول Neon — انتظر ولا تغلق الصفحة.",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
      showConfirmButton: false,
    });

    startTransition(() => {
      // Server Action: سيعيد التوجيه إلى /admin/system?synced=... أو ?syncError=...
      const p = syncDatabase() as unknown as Promise<void>;
      p.catch((err) => {
        Swal.close();
        Swal.fire({
          icon: "error",
          title: "فشلت المزامنة",
          text: err instanceof Error ? err.message.slice(0, 400) : String(err).slice(0, 400),
          confirmButtonColor: "#dc2626",
          confirmButtonText: "حسنًا",
        });
      });
    });
  };

  return (
    <Card className={`mb-6 p-5 ${hasSchemaError ? "border-2 border-amber-300 bg-amber-50/50" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-3">
          <div className={`grid h-10 w-10 place-items-center rounded-xl ${hasSchemaError ? "bg-amber-500 text-white" : "bg-navy-900 text-white"}`}>
            <Database size={20} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-extrabold text-navy-900">مزامنة هيكل قاعدة البيانات</h2>
              {hasSchemaError ? <Badge tone="red">مطلوبة</Badge> : <Badge tone="green">متزامنة</Badge>}
            </div>
            <p className="mt-1 max-w-2xl text-[13px] leading-6 text-ink-soft">
              يطابق جداول Neon في{" "}
              <code dir="ltr" className="rounded bg-black/5 px-1.5 py-0.5 text-[11px]">
                ep-noisy-mode-av88xqhy-pooler.c-11.us-east-1.aws.neon.tech
              </code>{" "}
              مع <code dir="ltr">prisma/schema.prisma</code> دون حذف البيانات.
              استخدمه عند ظهور خطأ{" "}
              <code dir="ltr" className="rounded bg-red-50 px-1 py-0.5 text-red-700">
                This page couldn’t load — A server error occurred
              </code>{" "}
              بعد نشر كود جديد غيّر الهيكل.
            </p>
            <p className="mt-1.5 text-[11.5px] text-ink-soft">
              يعادل <code dir="ltr">npx prisma db push --accept-data-loss --skip-generate</code> على الخادم (يستخدم{" "}
              <code dir="ltr">POSTGRES_URL_NON_POOLING</code> تلقائيًا).
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSync}
          disabled={pending}
          className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-5 py-2.5 text-[13.5px] font-extrabold shadow-sm disabled:opacity-60 ${
            hasSchemaError
              ? "bg-amber-600 text-white hover:bg-amber-700"
              : "bg-navy-900 text-white hover:bg-black"
          }`}
        >
          {pending ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          {pending ? "جارٍ المزامنة..." : "مزامنة الهيكل الآن"}
        </button>
      </div>

      {hasSchemaError && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-white px-4 py-3 text-[12px] leading-6 text-amber-900">
          <b>لماذا هذا الخطأ على الإنتاج فقط؟</b> محليًا لديك قاعدة <code dir="ltr">hadith</code> على{" "}
          <code dir="ltr">localhost</code> ومزامنة يدويًا بـ <code dir="ltr">prisma db push</code>، بينما قاعدة cPanel
          المنفصلة على Neon لم تُحدَّث بعد — فتظل جداولها قديمة ويفشل كل استعلام. هذا الزر يحدّثها دون الحاجة لـ SSH.
        </div>
      )}
    </Card>
  );
}
