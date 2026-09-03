import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Field, TextArea, Checkbox } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { CALENDLY_URL_SETTING_KEY } from "@/lib/calendly";
import { saveSettings } from "./actions";
import { ImagePickerField } from "@/components/admin/ImagePickerField";

/**
 * مفاتيح تعرفها اللوحة وقد لا يكون لها صفٌّ في القاعدة بعد.
 * الصفحة تُبنى من صفوف جدول settings، فمفتاحٌ جديدٌ لا يظهر حتى يُحفظ أوّل مرّة —
 * وهي حلقةٌ مفرغة تمنع المدير من ضبطه أصلًا. فنعرضه هنا فارغًا، وsaveSettings
 * يُنشئ الصفّ بالـupsert عند أوّل حفظ بلا حاجة إلى هجرةٍ أو بذرةٍ في القاعدة.
 */
const EXTRA_KEYS: { key: string; group: string }[] = [
  { key: CALENDLY_URL_SETTING_KEY, group: "admissions" },
  { key: "certificate.logo", group: "certificate" },
  { key: "certificate.signature1", group: "certificate" },
  { key: "certificate.signature1Name", group: "certificate" },
  { key: "certificate.signature2", group: "certificate" },
  { key: "certificate.signature2Name", group: "certificate" },
  { key: "system.debug", group: "system" },
];

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
  [CALENDLY_URL_SETTING_KEY]: "رابط حجز المقابلة العلميّة (Calendly)",
  "certificate.logo": "شعار الشهادة",
  "certificate.signature1": "التوقيع الإلكتروني الأول",
  "certificate.signature1Name": "اسم وصفة صاحب التوقيع الأول",
  "certificate.signature2": "التوقيع الإلكتروني الثاني",
  "certificate.signature2Name": "اسم وصفة صاحب التوقيع الثاني",
  "system.debug": "وضع التصحيح (Debug — إظهار تفاصيل الأخطاء)",
};

const HINTS: Record<string, string> = {
  [CALENDLY_URL_SETTING_KEY]:
    "الصق رابط نوع الحدث من Calendly، مثل https://calendly.com/hadith-college/interview — واتركه فارغًا لإخفاء أداة الحجز من صفحة المقابلة.",
  "system.debug":
    "عند التفعيل تُعرض رسائل الخطأ الكاملة وتتبّع المكدّس في لوحة الإدارة (مفيد لتشخيص خطأ 500 مثل /admin/courses). أطفئه بعد الانتهاء — لا تتركه مفعّلًا في الإنتاج.",
};

const GROUP_TITLES: Record<string, string> = {
  brand: "الهوية والاسم",
  contact: "بيانات التواصل",
  general: "عام",
  site: "الموقع",
  university: "الجامعة",
  header: "روابط الهيدر (البث والجامعة)",
  admissions: "القبول والمقابلات",
  certificate: "تصميم الشهادات والتواقيع",
  system: "النظام والتشخيص",
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
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { saved } = await searchParams;
  let settings: Awaited<ReturnType<typeof prisma.setting.findMany>> = [];
  let settingsError: string | null = null;
  try {
    settings = await prisma.setting.findMany({ orderBy: [{ group: "asc" }, { key: "asc" }] });
  } catch (e) {
    settingsError = e instanceof Error ? e.message.split("\n")[0].slice(0, 400) : String(e).slice(0, 400);
  }

  type Row = { key: string; group: string; labelAr: string | null; value: string };
  const rows: Row[] = settings.map((s) => ({
    key: s.key,
    group: s.group,
    labelAr: s.labelAr,
    value: s.value == null ? "" : String(s.value),
  }));
  for (const extra of EXTRA_KEYS) {
    if (!rows.some((r) => r.key === extra.key)) {
      rows.push({ key: extra.key, group: extra.group, labelAr: null, value: "" });
    }
  }

  const groups = new Map<string, Row[]>();
  for (const s of rows) {
    const g = groups.get(s.group) ?? [];
    g.push(s);
    groups.set(s.group, g);
  }

  return (
    <div>
      <PageHeader title="الإعدادات العامة" desc="اسم الكلّية والهوية وبيانات التواصل." />

      {settingsError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] leading-6 text-red-700">
          <b>تعذّر تحميل الإعدادات من قاعدة البيانات:</b> <code dir="ltr" className="break-all">{settingsError}</code>
          <span className="block mt-1 text-[12px] text-amber-800">
            إن كانت قاعدة Neon غير متزامنة، اذهب إلى <a href="/admin/system" className="font-bold underline">/admin/system ← مزامنة الهيكل</a> أولًا، أو فعّل Debug عبر متغير البيئة <code dir="ltr">DEBUG=true</code> في Vercel.
          </span>
        </div>
      )}

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
                    const value = s.value;
                    if (s.key === "system.debug") {
                      const checked = value === "true" || value === "1" || value === "on";
                      return (
                        <div key={s.key} className="sm:col-span-2">
                          <input type="hidden" name="system.debug" value="false" />
                          <Checkbox label={label} name="system.debug" defaultChecked={checked} />
                          {HINTS[s.key] && (
                            <span className="mt-1.5 block text-[11.5px] text-ink-soft">{HINTS[s.key]}</span>
                          )}
                          <span className="mt-1 block text-[11px] text-amber-700">
                            القيمة الحالية: <code dir="ltr">{value || "false"}</code> — فعّلها ثم أعد تحميل صفحة الخطأ لرؤية التفاصيل.
                          </span>
                        </div>
                      );
                    }
                    return (
                      <div key={s.key} className={isLong(s.key) ? "sm:col-span-2" : ""}>
                        {/^certificate\.(logo|signature\d)$/.test(s.key) ? (
                          <ImagePickerField label={label} name={s.key} defaultValue={value} />
                        ) : isLong(s.key) ? (
                          <TextArea label={label} name={s.key} defaultValue={value} dir={isLtr(s.key) ? "ltr" : "rtl"} />
                        ) : (
                          <Field
                            label={label}
                            name={s.key}
                            defaultValue={value}
                            dir={isLtr(s.key) ? "ltr" : "rtl"}
                            hint={HINTS[s.key]}
                          />
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
