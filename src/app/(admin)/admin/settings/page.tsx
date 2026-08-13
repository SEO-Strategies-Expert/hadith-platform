import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Field, TextArea } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { saveSettings } from "./actions";

const LABELS: Record<string, string> = {
  "site.nameAr": "اسم الكلّية (عربي)",
  "site.nameEn": "اسم الكلّية (إنجليزي)",
  "site.shortAr": "الاسم المختصر (عربي)",
  "site.shortEn": "الاسم المختصر (إنجليزي)",
  "site.taglineAr": "الشعار الوصفي (عربي)",
  "site.taglineEn": "الشعار الوصفي (إنجليزي)",
  "university.nameAr": "اسم الجامعة (عربي)",
  "university.nameEn": "اسم الجامعة (إنجليزي)",
  "contact.email": "البريد الإلكتروني",
  "contact.phone": "الهاتف",
  "contact.addressAr": "العنوان (عربي)",
  "contact.addressEn": "العنوان (إنجليزي)",
  "header.liveUrl": "رابط البث المباشر",
  "header.universityUrl": "رابط منصّة الجامعة",
  "header.universitySocialUrl": "رابط صفحات الجامعة على التواصل",
};

const GROUP_TITLES: Record<string, string> = {
  brand: "الهوية والاسم",
  contact: "بيانات التواصل",
  general: "عام",
  site: "الموقع",
  university: "الجامعة",
  header: "روابط الهيدر (البث والجامعة)",
};

function isLtr(key: string) {
  return /En$|email|phone|url|link/i.test(key);
}
function isLong(key: string) {
  return /address|tagline|desc/i.test(key);
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;
  const settings = await prisma.setting.findMany({ orderBy: [{ group: "asc" }, { key: "asc" }] });

  const groups = new Map<string, typeof settings>();
  for (const s of settings) {
    const g = groups.get(s.group) ?? [];
    g.push(s);
    groups.set(s.group, g);
  }

  return (
    <div>
      <PageHeader title="الإعدادات العامة" desc="اسم الكلّية والهوية وبيانات التواصل." />

      {saved && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[13px] font-bold text-emerald-700">
          تم حفظ الإعدادات بنجاح.
        </div>
      )}

      <Card className="max-w-3xl p-6">
        <ActionForm
          action={saveSettings.bind(null, "/admin/settings")}
          cancelHref="/admin/settings"
        >
          <div className="space-y-7">
            {[...groups.entries()].map(([group, items]) => (
              <div key={group}>
                <h3 className="mb-3 text-[14px] font-extrabold text-gold-3">
                  {GROUP_TITLES[group] ?? group}
                </h3>
                <div className="grid gap-5 sm:grid-cols-2">
                  {items.map((s) => {
                    const label = LABELS[s.key] ?? s.labelAr ?? s.key;
                    const value = s.value == null ? "" : String(s.value);
                    return (
                      <div key={s.key} className={isLong(s.key) ? "sm:col-span-2" : ""}>
                        {isLong(s.key) ? (
                          <TextArea label={label} name={s.key} defaultValue={value} dir={isLtr(s.key) ? "ltr" : "rtl"} />
                        ) : (
                          <Field label={label} name={s.key} defaultValue={value} dir={isLtr(s.key) ? "ltr" : "rtl"} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ActionForm>
      </Card>
    </div>
  );
}
