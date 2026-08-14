import { prisma } from "@/lib/prisma";
import type { FieldDef } from "@/lib/resources";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * يملأ خيارات حقول الاختيار المرتبطة بجداول أخرى (مثل «المرحلة» في المقرّرات)
 * قبل تصيير النموذج، فتظهر القيم الحقيقية بدل قائمة فارغة.
 */
export async function withRelationOptions(fields: FieldDef[]): Promise<FieldDef[]> {
  return Promise.all(
    fields.map(async (f) => {
      if (!f.relation) return f;
      const rows: any[] = await (prisma as any)[f.relation.model].findMany({
        orderBy: { order: "asc" },
      });
      const options = rows.map((r) => ({ value: r.id as string, label: String(r[f.relation!.labelField] ?? r.id) }));
      return {
        ...f,
        options: [{ value: "", label: f.relation.emptyLabel ?? "— اختر —" }, ...options],
      };
    })
  );
}
