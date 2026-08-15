import { redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guard";
import { PageHeader, Card, Badge, EmptyState } from "@/components/admin/ui";
import { assignScholar, unassignScholar, promoteToInstructor } from "./actions";
import { AssignForm, UnlinkButton, PromoteForm } from "./forms";

/**
 * شاشة ربط حسابات المحاضرين بملفّاتهم في الهيئة العلميّة.
 *
 * لماذا هذه الشاشة أصلًا؟ لأنّ المقرّرات والمجالس مرتبطة بـ`Scholar` بينما
 * الدخول مرتبط بـ`User`. فبلا هذا الجسر (`User.scholarId`) لا يستطيع النظام أن
 * يعرف أيّ مقرّراتٍ لأيّ حساب، وتبقى لوحة المحاضر فارغةً بلا سبب ظاهر.
 */
export default async function InstructorsPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/admin");
  }

  const [instructors, scholars, linkedRows] = await Promise.all([
    prisma.user.findMany({
      where: { role: "INSTRUCTOR" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        scholarId: true,
        scholar: { select: { id: true, nameAr: true, rankAr: true } },
      },
    }),
    prisma.scholar.findMany({
      orderBy: [{ order: "asc" }, { nameAr: "asc" }],
      select: { id: true, nameAr: true },
    }),
    // من يحمل كل ملفّ الآن — لنُظهر «مسنَد إلى…» داخل القائمة قبل المحاولة.
    prisma.user.findMany({
      where: { scholarId: { not: null } },
      select: { name: true, scholarId: true },
    }),
  ]);

  const takenBy = new Map(linkedRows.map((r) => [r.scholarId as string, r.name]));
  const scholarOptions = scholars.map((s) => ({
    id: s.id,
    nameAr: s.nameAr,
    takenBy: takenBy.get(s.id) ?? null,
  }));

  const unlinked = instructors.filter((u) => !u.scholarId).length;

  return (
    <div>
      <PageHeader
        title="أعضاء هيئة التدريس"
        desc="ربط حسابات المحاضرين بملفّاتهم في «الهيئة العلمية» — منه تُشتقّ مقرّراتهم ومجالسهم."
      />

      {unlinked > 0 && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-[12.5px] text-amber-900">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <p className="font-semibold leading-6">
            {unlinked} حساب بلا ربط بملفّ هيئة. هذه الحسابات ترى لوحةً فارغة تمامًا — لا مقرّرات
            ولا مجالس ولا طلاب — حتى تربطها بملفّاتها.
          </p>
        </div>
      )}

      <Card className="mb-6 p-5">
        <h2 className="mb-3 text-[15px] font-extrabold text-navy-900">ترقية حساب موجود</h2>
        <p className="mb-3 text-[12.5px] leading-6 text-ink-soft">
          حوّل حسابًا قائمًا إلى دور «عضو هيئة تدريس»، ثم اربطه بملفّه من الجدول أدناه.
        </p>
        <PromoteForm action={promoteToInstructor} />
      </Card>

      <Card>
        {instructors.length === 0 ? (
          <EmptyState label="لا حسابات بدور «عضو هيئة تدريس» بعد. ابدأ بترقية حساب من الأعلى." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-[13.5px]">
              <thead>
                <tr className="border-b border-black/5 text-[12px] text-ink-soft">
                  <th className="px-4 py-3 font-bold">الحساب</th>
                  <th className="px-4 py-3 font-bold">الحالة</th>
                  <th className="px-4 py-3 font-bold">ملفّ الهيئة المرتبط</th>
                  <th className="px-4 py-3 font-bold">الربط</th>
                </tr>
              </thead>
              <tbody>
                {instructors.map((u) => (
                  <tr key={u.id} className="border-b border-black/5 last:border-0 align-top hover:bg-cream-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-navy-800 text-[13px] font-bold text-gold-1">
                          {u.name.charAt(0)}
                        </span>
                        <div>
                          <div className="font-bold text-navy-900">{u.name}</div>
                          <div className="text-[12px] text-ink-soft" dir="ltr">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge tone={u.status === "ACTIVE" ? "green" : "red"}>
                        {u.status === "ACTIVE" ? "نشط" : "معطّل"}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      {u.scholar ? (
                        <div>
                          <div className="font-bold text-navy-900">{u.scholar.nameAr}</div>
                          {u.scholar.rankAr && (
                            <div className="text-[12px] text-ink-soft">{u.scholar.rankAr}</div>
                          )}
                        </div>
                      ) : (
                        <Badge tone="red">بلا ربط — لوحته فارغة</Badge>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-2">
                        <AssignForm
                          action={assignScholar.bind(null, u.id)}
                          scholars={scholarOptions}
                          currentScholarId={u.scholarId}
                        />
                        {u.scholarId && <UnlinkButton action={unassignScholar.bind(null, u.id)} />}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
