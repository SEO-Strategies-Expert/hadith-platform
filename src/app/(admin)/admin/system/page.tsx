import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guard";
import { Card, PageHeader, Badge } from "@/components/admin/ui";
import { getDbInfo, formatBytes } from "@/lib/db-info";
import { queueBackup } from "./actions";

export default async function SystemPage({
  searchParams,
}: {
  searchParams: Promise<{ restored?: string; restoreError?: string; wiped?: string; tables?: string; wipeError?: string }>;
}) {
  await requireAdmin();
  const { restored, restoreError, wiped, tables, wipeError } = await searchParams;
  const [logs, jobs, db] = await Promise.all([
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.systemJob.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    getDbInfo(),
  ]);
  const integrations = [
    ["التخزين", Boolean(process.env.BLOB_READ_WRITE_TOKEN)],
    ["البريد", Boolean(process.env.RESEND_API_KEY || process.env.SMTP_HOST)],
    ["المراقبة", Boolean(process.env.SENTRY_DSN)],
    ["مهام Cron", Boolean(process.env.CRON_SECRET)],
  ] as const;
  const providerTone = db.provider === "Neon" ? "blue" : db.provider === "Local" ? "gold" : "gray";
  return <div><PageHeader title="الأمان والتشغيل" desc="سجل التدقيق، النسخ الاحتياطي، حالة التكاملات وطوابير المعالجة." />
    {restored && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[13px] font-bold text-emerald-700">تمت الاستعادة: أُدرج {restored} صفًّا (الموجود مسبقًا لم يُمسّ).</div>}
    {restoreError && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[13px] font-bold text-red-700">فشلت الاستعادة: {restoreError}</div>}
    {wiped !== undefined && <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-[13px] font-bold text-amber-800">حُذفت كل البيانات: {wiped} صفًّا تقريبًا من {tables ?? "?"} جدولًا. الجداول فارغة الآن — استعد نسخةً أو أعد البذر.</div>}
    {wipeError && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[13px] font-bold text-red-700">فشل الحذف: {wipeError === "CONFIRM_MISMATCH" ? "اكتب اسم قاعدة البيانات حرفيًّا كما يظهر أدناه." : wipeError}</div>}

    <Card className="mb-6 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-extrabold text-navy-900">قاعدة البيانات</h2>
        <Badge tone={db.ok ? "green" : "red"}>{db.ok ? "متصلة" : "غير متصلة"}</Badge>
        <Badge tone={providerTone}>{db.provider === "Neon" ? "Neon (سحابة)" : db.provider === "Local" ? "محلّية" : db.provider}</Badge>
        {db.sizePretty && <Badge tone="gray">{db.sizePretty}</Badge>}
      </div>
      {!db.ok && db.error && <p className="mt-2 text-[13px] font-bold text-red-600" dir="ltr">{db.error}</p>}
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[["المضيف", db.host ? `${db.host}${db.port ? `:${db.port}` : ""}` : "—", true], ["القاعدة", db.database ?? "—", true], ["المستخدم", db.user ?? "—", true], ["زمن الاستجابة", db.latencyMs != null ? `${db.latencyMs} ms` : "—", true]].map(([label, value, ltr]) => (
          <div key={label as string} className="rounded-xl bg-black/[.03] p-3">
            <div className="text-[11.5px] font-bold text-ink-soft">{label}</div>
            <div className="mt-1 break-all text-[13px] font-bold text-navy-900" dir={ltr ? "ltr" : undefined}>{value}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-xl bg-black/[.03] p-3">
        <div className="text-[11.5px] font-bold text-ink-soft">رابط الاتصال (كلمة المرور مُخفاة)</div>
        <code className="mt-1 block break-all text-[12px] text-navy-900" dir="ltr">{db.maskedUrl}</code>
        {db.version && <div className="mt-1 text-[11.5px] text-ink-soft" dir="ltr">{db.version}</div>}
      </div>
      {db.counts && Object.keys(db.counts).length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(db.counts).map(([k, v]) => <span key={k} className="rounded-full bg-black/5 px-3 py-1 text-[12px] font-bold">{k}: {v}</span>)}
        </div>
      )}
      {db.tables && db.tables.length > 0 && (
        <div className="mt-4 overflow-auto">
          <table className="w-full text-[12px]">
            <thead><tr className="text-right text-ink-soft"><th className="p-2">الجدول</th><th className="p-2">صفوف (تقريبي)</th><th className="p-2">الحجم</th></tr></thead>
            <tbody>
              {db.tables.map((t) => (
                <tr key={t.table} className="border-t"><td className="p-2 font-bold" dir="ltr">{t.table}</td><td className="p-2">{t.rows ?? "—"}</td><td className="p-2">{formatBytes(t.sizeBytes)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>

    <div className="mb-6 grid gap-6 xl:grid-cols-2">
      <Card className="p-5">
        <h2 className="font-extrabold text-navy-900">النسخ الاحتياطي (تنزيل)</h2>
        <p className="my-2 text-sm text-ink-soft">ملفّ JSON كامل بكل الجداول والصفوف من القاعدة المتصلة حاليًا — تُستخدم لترى أي قاعدة يستخدمها النشر، ولنقل البيانات بين المحلّية والإنتاج.</p>
        <div className="flex flex-wrap gap-2">
          <a href="/api/admin/db-export" className="rounded-xl bg-navy-900 px-4 py-2 text-sm font-bold text-white">تنزيل نسخة JSON الآن</a>
        </div>
        <form action={queueBackup} className="mt-3"><button className="rounded-xl border px-4 py-2 text-sm font-bold">طلب نسخة مشفّرة للعامل الخلفي</button></form>
      </Card>
      <Card className="p-5">
        <h2 className="font-extrabold text-navy-900">الاستعادة (رفع)</h2>
        <p className="my-2 text-sm text-ink-soft">ارفع ملفّ نسخة JSON. الاستعادة <b>دمج فقط</b>: تُدرج الصفوف الغائبة وتتجاهل الموجودة — لا تحذف شيئًا.</p>
        <form action="/api/admin/db-import" method="post" encType="multipart/form-data" className="flex flex-wrap items-center gap-2">
          <input type="file" name="backup" accept="application/json,.json" required className="text-sm" />
          <button type="submit" className="rounded-xl bg-gold-3 px-4 py-2 text-sm font-extrabold text-navy-950">استعادة (دمج)</button>
        </form>
      </Card>
    </div>

    <Card className="mb-6 border-2 border-red-300 p-5">
      <h2 className="font-extrabold text-red-700">منطقة الخطر: حذف كل البيانات</h2>
      <p className="my-2 text-sm text-ink-soft">يحذف <b>كل الصفوف من كل جداول</b> القاعدة المتصلة حاليًا (<b dir="ltr">{db.database ?? "—"}</b>) — بما فيها حسابك. الجداول نفسها تبقى فارغة، وجلستك تظل صالحة فتستطيع الاستعادة فورًا. نزّل نسخة JSON أولًا إن أردت التراجع. للتأكيد اكتب اسم القاعدة حرفيًّا:</p>
      <form action="/api/admin/db-wipe" method="post" className="flex flex-wrap items-center gap-2">
        <input type="text" name="confirm" required autoComplete="off" placeholder={db.database ?? ""} dir="ltr" className="rounded-xl border border-red-300 px-3 py-2 text-sm" />
        <button type="submit" className="rounded-xl bg-red-700 px-4 py-2 text-sm font-extrabold text-white">حذف كل البيانات</button>
      </form>
    </Card>
    <div className="mb-6 grid gap-3 sm:grid-cols-4">{integrations.map(([name, ready]) => <Card key={name} className="p-4"><b>{name}</b><div className="mt-2"><Badge tone={ready ? "green" : "gold"}>{ready ? "مهيّأ" : "يحتاج إعدادًا"}</Badge></div></Card>)}</div>
    <div className="grid gap-6 xl:grid-cols-2"><Card className="overflow-hidden"><h2 className="p-5 font-extrabold">آخر عمليات التدقيق</h2><div className="max-h-96 overflow-auto">{logs.map((x) => <div key={x.id} className="border-t p-3 text-xs"><b>{x.action}</b> · {x.entity} {x.entityId && `#${x.entityId.slice(-7)}`}<time className="block text-ink-soft">{x.createdAt.toLocaleString("ar")}</time></div>)}</div></Card>
    <Card className="overflow-hidden"><h2 className="p-5 font-extrabold">طابور المهام</h2><div className="max-h-96 overflow-auto">{jobs.map((x) => <div key={x.id} className="flex justify-between border-t p-3 text-xs"><span><b>{x.kind}</b><small className="block text-ink-soft">{x.createdAt.toLocaleString("ar")}</small></span><Badge tone={x.status === "completed" ? "green" : x.status === "failed" ? "red" : "blue"}>{x.status}</Badge></div>)}</div></Card></div>
  </div>;
}
