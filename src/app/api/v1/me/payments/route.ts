/**
 * دفعات الطالب وملخّصها الماليّ.
 *
 * الحساب كلّه بـ`lib/payments.ts`: المبالغ تُجمع أعدادًا صحيحة بالوحدة الصغرى
 * ثمّ تُعاد نصًّا عشريًّا مضبوطًا. لا نرسل `number` للتطبيق لئلّا يتسرّب خطأ
 * الفاصلة العائمة إلى شاشةٍ ماليّة.
 *
 * ولا يخرج `note` (ملاحظة إداريّة) ولا `provider`/`providerRef` (معرّفات بوّابة).
 */
import { prisma } from "@/lib/prisma";
import { requireApiStudent } from "@/lib/api-auth";
import { summarizeByCurrency, minorToPlain, type PaymentTotals } from "@/lib/payments";
import { ok, fail } from "../../_lib";
import { cors, preflight, paging, cursorArgs, page } from "../../_http";
import { paymentForStudent } from "../../_dto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const METHODS = "GET, OPTIONS";

export async function OPTIONS(req: Request) {
  return preflight(req, "app", METHODS);
}

function totalsForApi(t: PaymentTotals) {
  return {
    currency: t.currency,
    collected: minorToPlain(t.collected),
    pending: minorToPlain(t.pending),
    waived: minorToPlain(t.waived),
    refunded: minorToPlain(t.refunded),
    failed: minorToPlain(t.failed),
    net: minorToPlain(t.net),
    counts: t.counts,
  };
}

export async function GET(req: Request) {
  try {
    const id = await requireApiStudent(req);
    const { limit, cursor } = paging(req);

    const rows = await prisma.payment.findMany({
      where: { userId: id.userId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...cursorArgs(cursor),
      select: {
        id: true,
        amount: true,
        currency: true,
        status: true,
        method: true,
        paidAt: true,
        createdAt: true,
        enrollment: { select: { id: true, course: { select: { id: true, titleAr: true, titleEn: true } } } },
      },
    });

    const { items, nextCursor } = page(rows, limit);

    // الملخّص مع الصفحة الأولى وحدها: هو مجموع **كل** دفعات الطالب لا الصفحة،
    // وإعادته مع كل صفحة تكرارٌ لاستعلامٍ لا يتغيّر جوابه.
    let totals: ReturnType<typeof totalsForApi>[] | null = null;
    if (!cursor) {
      const all = await prisma.payment.findMany({
        where: { userId: id.userId },
        select: { amount: true, currency: true, status: true },
      });
      totals = summarizeByCurrency(all).map(totalsForApi);
    }

    return cors(
      req,
      ok({ items: items.map(paymentForStudent), nextCursor, totals }),
      "app",
      METHODS
    );
  } catch (e) {
    return cors(req, fail(e), "app", METHODS);
  }
}
