"use client";

import { Trash2 } from "lucide-react";

export function DeleteButton({
  action,
  confirm = "هل أنت متأكد من الحذف؟ لا يمكن التراجع.",
}: {
  action: (formData: FormData) => void | Promise<void>;
  confirm?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirm)) e.preventDefault();
      }}
    >
      <button
        type="submit"
        className="grid h-9 w-9 place-items-center rounded-lg text-red-600 transition hover:bg-red-50"
        title="حذف"
        aria-label="حذف"
      >
        <Trash2 size={16} />
      </button>
    </form>
  );
}
