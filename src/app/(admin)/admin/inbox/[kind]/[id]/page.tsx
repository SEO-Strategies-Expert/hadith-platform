import Link from "next/link";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Select, TextArea } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { getInbox, FEE_LABELS, STATUS_OPTIONS } from "@/lib/inbox";
import { updateEntry } from "../../actions";
import { createStudentFromApplication } from "../../../students/actions";

/* eslint-disable @typescript-eslint/no-explicit-any */

function fmt(d: Date): string {
  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(d);
}

export default async function InboxEntryPage({
  params,
}: {
  params: Promise<{ kind: string; id: string }>;
}) {
  const { kind, id } = await params;
  const cfg = getInbox(kind);
  if (!cfg) notFound();

  const row: any = await (prisma as any)[cfg.model].findUnique({ where: { id } });
  if (!row) notFound();

  return (
    <div>
      <PageHeader title={cfg.singularAr} desc={`${cfg.titleAr} — وصلت ${fmt(row.createdAt)}`} />

      <div className="mb-4">
        <Link
          href={`/admin/inbox/${cfg.key}`}
          className="text-[13px] font-bold text-navy-700 hover:text-gold-3"
        >
          → العودة إلى {cfg.titleAr}
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card className="p-6">
          <dl className="space-y-4">
            {cfg.fields.map((f) => {
              const value = row[f.name];
              if (f.file) {
                return (
                  <div key={f.name}>
                    <dt className="text-[12.5px] font-bold text-ink-soft">{f.label}</dt>
                    <dd className="mt-1">
                      {value ? (
                        <a
                          href={`/api/admin/files/${value}`}
                          className="inline-flex items-center gap-2 rounded-lg border border-black/10 px-3 py-2 text-[13px] font-bold text-navy-800 hover:border-gold/50"
                        >
                          <Download size={15} />
                          {row[f.name.replace("Path", "Name")] ?? "تنزيل الملف"}
                        </a>
                      ) : (
                        <span className="text-[13.5px] text-ink-soft">— لم يُرفَع ملف</span>
                      )}
                    </dd>
                  </div>
                );
              }
              const shown =
                f.name === "feeOption" && value ? FEE_LABELS[value] ?? value : value;
              return (
                <div key={f.name}>
                  <dt className="text-[12.5px] font-bold text-ink-soft">{f.label}</dt>
                  <dd
                    className={`mt-0.5 text-[14px] text-navy-900 ${f.long ? "whitespace-pre-wrap leading-7" : ""}`}
                  >
                    {shown == null || shown === "" ? "—" : String(shown)}
                  </dd>
                </div>
              );
            })}
            <div>
              <dt className="text-[12.5px] font-bold text-ink-soft">لغة الإرسال</dt>
              <dd className="mt-0.5 text-[14px] text-navy-900">
                {row.lang === "en" ? "الإنجليزية" : "العربية"}
              </dd>
            </div>
          </dl>

          {cfg.key === "admissions" && (
            <form action={createStudentFromApplication.bind(null, id)} className="mt-6">
              <button
                type="submit"
                className="rounded-xl bg-gradient-to-l from-gold-1 to-gold-3 px-5 py-2.5 text-[13.5px] font-extrabold text-navy-950 shadow-md hover:brightness-105"
              >
                إنشاء حساب طالب من هذا الطلب
              </button>
              <span className="mr-3 text-[12px] text-ink-soft">
                يُنشئ الحساب بكلمة مرور مؤقّتة تُحفظ في ملاحظة الطلب.
              </span>
            </form>
          )}

          {row.email || row.authorEmail ? (
            <a
              href={`mailto:${row.email ?? row.authorEmail}`}
              className="mt-6 inline-block rounded-xl border border-black/10 px-4 py-2.5 text-[13.5px] font-bold text-navy-800 hover:border-gold/50"
            >
              الردّ بالبريد ←
            </a>
          ) : null}
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-[15px] font-extrabold text-navy-900">المعالجة</h2>
          <ActionForm
            action={updateEntry.bind(null, cfg.key, id)}
            cancelHref={`/admin/inbox/${cfg.key}`}
          >
            <Select label="الحالة" name="status" options={STATUS_OPTIONS} defaultValue={row.status} />
            <TextArea
              label="ملاحظة داخلية"
              name="note"
              defaultValue={row.note}
              dir="rtl"
              rows={6}
              hint="لا تظهر للمُرسِل — للتنسيق بين فريق اللوحة."
            />
          </ActionForm>
        </Card>
      </div>
    </div>
  );
}
