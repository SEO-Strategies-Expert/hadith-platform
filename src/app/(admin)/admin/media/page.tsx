import { prisma } from "@/lib/prisma";
import { PageHeader, Card, EmptyState } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { uploadMedia, deleteMedia } from "./actions";
import { MediaDropzone } from "@/components/admin/MediaDropzone";
import { Images, HardDrive } from "lucide-react";

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<{ uploaded?: string }>;
}) {
  const { uploaded } = await searchParams;
  const media = await prisma.media.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <PageHeader title="مكتبة الوسائط" desc="رفع الصور والفيديو والصوت والملفات والترجمات، مع حالة معالجة وحماية التخزين." />

      {uploaded && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[13px] font-bold text-emerald-700">
          تم رفع الملف بنجاح.
        </div>
      )}

      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-4 shadow-sm"><span className="grid h-11 w-11 place-items-center rounded-xl bg-gold/15 text-gold-3"><Images size={21}/></span><div><b className="block text-xl text-navy-900">{media.length}</b><span className="text-[12px] text-ink-soft">صورة في المكتبة</span></div></div>
        <div className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-4 shadow-sm"><span className="grid h-11 w-11 place-items-center rounded-xl bg-sky-100 text-sky-700"><HardDrive size={21}/></span><div><b className="block text-xl text-navy-900">100 MB</b><span className="text-[12px] text-ink-soft">الحد الأقصى للفيديو</span></div></div>
      </div>

      <Card className="mb-7 max-w-4xl p-6">
        <ActionForm action={uploadMedia} cancelHref="/admin/media" submitLabel="رفع الملف إلى المكتبة">
          <MediaDropzone />
        </ActionForm>
      </Card>

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between border-b border-black/5 pb-4"><div><h2 className="text-[16px] font-extrabold text-navy-900">الصور المرفوعة</h2><p className="mt-1 text-[11.5px] text-ink-soft">أحدث الصور تظهر أولًا</p></div></div>
        {media.length === 0 ? (
          <EmptyState label="لا توجد وسائط بعد. ارفع أول صورة." />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {media.map((m) => (
              <div key={m.id} className="overflow-hidden rounded-xl border border-black/10 bg-cream-50">
                <div className="grid aspect-video place-items-center overflow-hidden bg-navy-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {m.assetType === "image" ? <img src={m.url} alt={m.filename} className="h-full w-full object-cover" /> : <span className="text-center text-xs font-bold text-white">{m.assetType}<br/>{m.processingStatus}</span>}
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
