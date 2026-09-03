"use client";

import { useTransition } from "react";
import { Trash2, Loader2 } from "lucide-react";
import Swal from "sweetalert2";

export function DeleteButton({
  action,
  confirm = "هل أنت متأكد من الحذف؟ لا يمكن التراجع.",
}: {
  action: (formData: FormData) => void | Promise<void>;
  confirm?: string;
}) {
  const [pending, startTransition] = useTransition();

  const handleClick = async () => {
    const result = await Swal.fire({
      title: "هل أنت متأكد؟",
      text: confirm,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "نعم، احذف",
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
    startTransition(() => {
      // Server actions are invoked with FormData; extra arg is harmless for bound actions
      const maybePromise = (action as unknown as (fd: FormData) => unknown)(new FormData());
      if (maybePromise instanceof Promise) {
        maybePromise.catch(() => {
          Swal.fire({
            icon: "error",
            title: "تعذّر الحذف",
            text: "حدث خطأ أثناء الحذف. حاول مرة أخرى.",
            confirmButtonColor: "#dc2626",
            confirmButtonText: "حسنًا",
          });
        });
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="grid h-9 w-9 place-items-center rounded-lg text-red-600 transition hover:bg-red-50 disabled:opacity-60"
      title="حذف"
      aria-label="حذف"
    >
      {pending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
    </button>
  );
}
