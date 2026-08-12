import { prisma } from "@/lib/prisma";
import { PageHeader, Card, EmptyState } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { uploadMedia, deleteMedia } from "./actions";

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<{ uploaded?: string }>;
}) {
  const { uploaded } = await searchParams;
  const media = await prisma.media.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <PageHeader title="الوسائط والصور" desc="رفع الصور وإدارتها (Vercel Blob)." />

      {uploaded && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[13px] font-bold text-emerald-700">
          تم رفع الملف بنجاح.
        </div>
      )}

      <Card className="mb-6 max-w-2xl p-6">
        <ActionForm action={uploadMedia} cancelHref="/admin/media" submitLabel="رفع الصورة">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-bold text-navy-900">اختر صورة (حتى 8MB)</span>
            <input
              type="file"
              name="file"
              accept="image/*"
              className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-[13px] file:mr-3 file:rounded-lg file:border-0 file:bg-navy-800 file:px-3 file:py-1.5 file:text-white"
            />
          </label>
        </ActionForm>
      </Card>

      <Card className="p-5">
        {media.length === 0 ? (
          <EmptyState label="لا توجد وسائط بعد. ارفع أول صورة." />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {media.map((m) => (
              <div key={m.id} className="overflow-hidden rounded-xl border border-black/10 bg-cream-50">
                <div className="grid aspect-video place-items-center overflow-hidden bg-navy-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.url} alt={m.filename} className="h-full w-full object-cover" />
                </div>
                <div className="p-2.5">
                  <div className="truncate text-[12px] font-bold text-navy-800" title={m.filename}>
                    {m.filename}
                  </div>
                  <input
                    readOnly
                    value={m.url}
                    dir="ltr"
                    className="mt-1.5 w-full rounded-lg border border-black/10 bg-white px-2 py-1 text-[10.5px] text-ink-soft"
                  />
                  <div className="mt-2 flex justify-end">
                    <DeleteButton action={deleteMedia.bind(null, m.id)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
