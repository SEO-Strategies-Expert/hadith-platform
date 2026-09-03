import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const BACKUP_VERSION = 1;

type ScalarField = { name: string; type: string };
type ModelShape = { model: string; client: string; scalars: ScalarField[] };

type DmmfField = {
  name: string;
  kind: "scalar" | "object" | "enum" | "unsupported";
  type: string | object;
  relationName?: string;
  relationFromFields?: string[];
  relationToFields?: string[];
  isList: boolean;
};

type DmmfModel = { name: string; fields: DmmfField[] };

type Delegate = {
  findMany: () => Promise<Record<string, unknown>[]>;
  createMany: (args: { data: Record<string, unknown>[]; skipDuplicates?: boolean }) => Promise<{ count: number }>;
};

function dmmfModels(): DmmfModel[] {
  const dmmf = (Prisma as unknown as { dmmf?: { datamodel?: { models?: DmmfModel[] } } }).dmmf;
  return dmmf?.datamodel?.models ?? [];
}

function clientName(model: string) {
  return model.charAt(0).toLowerCase() + model.slice(1);
}

function delegateFor(model: string): Delegate | null {
  const d = (prisma as unknown as Record<string, Delegate>)[clientName(model)];
  return d && typeof d.findMany === "function" && typeof d.createMany === "function" ? d : null;
}

/** كل النماذج القابلة للنسخ مع حقولها القياسيّة فقط (بلا علاقات متداخلة). */
export function backupModels(): ModelShape[] {
  return dmmfModels()
    .filter((m) => delegateFor(m.name))
    .map((m) => ({
      model: m.name,
      client: clientName(m.name),
      // القياسيّة والعدّادية (role/status...) — بلا علاقات متداخلة.
      // ملاحظة: حقول enum kindها "enum" لا "scalar"، فيجب تضمينها وإلا ضاعت الأدوار!
      scalars: m.fields
        .filter((f) => f.kind === "scalar" || f.kind === "enum")
        .map((f) => ({ name: f.name, type: typeof f.type === "string" ? f.type : "unknown" })),
    }));
}

/**
 * ترتيب النماذج بحيث تُدرَج الجداول الأب قبل الأبناء (احترام المفاتيح الأجنبية).
 * العلاقات الذاتية والحلقات تُتجاهَل بأمان — الاستعادة دمج (ON CONFLICT DO NOTHING).
 */
export function backupOrder(): string[] {
  const models = dmmfModels().filter((m) => delegateFor(m.name));
  const names = new Set(models.map((m) => m.name));
  const deps = new Map<string, Set<string>>(); // model -> parents it references
  for (const m of models) {
    const parents = new Set<string>();
    for (const f of m.fields) {
      if (f.kind !== "object" || f.isList || !f.relationName) continue;
      const from = f.relationFromFields ?? [];
      if (from.length === 0) continue; // الجهة العكسية — لا عمود FK هنا
      const target = typeof f.type === "string" ? f.type : null;
      if (target && target !== m.name && names.has(target)) parents.add(target);
    }
    deps.set(m.name, parents);
  }
  const order: string[] = [];
  const visited = new Set<string>();
  const visit = (name: string, stack: Set<string>) => {
    if (visited.has(name) || stack.has(name)) return; // حلقة: تُكسر هنا
    stack.add(name);
    for (const p of deps.get(name) ?? []) visit(p, stack);
    stack.delete(name);
    visited.add(name);
    order.push(name);
  };
  for (const m of models) visit(m.name, new Set());
  return order;
}

const jsonReplacer = (_k: string, v: unknown) => (typeof v === "bigint" ? Number(v) : v);

export type BackupPayload = {
  version: number;
  exportedAt: string;
  database: string | null;
  order: string[];
  tables: Record<string, Record<string, unknown>[]>;
};

/** تصدير كامل: كل الصفوف الخام لكل نموذج، بترتيب آمن للاستعادة. */
export async function exportDatabase(database: string | null): Promise<BackupPayload> {
  const order = backupOrder();
  const tables: Record<string, Record<string, unknown>[]> = {};
  for (const name of order) {
    const delegate = delegateFor(name);
    if (!delegate) continue;
    const rows = await delegate.findMany();
    // JSON ذهابًا وإيابًا لتطبيع Date/Decimal/BigInt إلى قيم قابلة للنقل.
    tables[name] = JSON.parse(JSON.stringify(rows, jsonReplacer)) as Record<string, unknown>[];
  }
  return { version: BACKUP_VERSION, exportedAt: new Date().toISOString(), database, order, tables };
}

export type RestoreResult = { model: string; rows: number; inserted: number; skipped?: boolean; error?: string };

/**
 * استعادة دمج: تُدرج الصفوف الغائبة وتتجاهل الموجودة (حسب القيود الفريدة).
 * لا تحذف شيئًا — آمنة على قاعدة فيها بيانات.
 */
export async function importDatabase(payload: BackupPayload): Promise<{ results: RestoreResult[]; total: number }> {
  if (!payload || payload.version !== BACKUP_VERSION || typeof payload.tables !== "object") {
    throw new Error("BAD_BACKUP_FORMAT");
  }
  const shapes = new Map(backupModels().map((s) => [s.model, s]));
  const order = (payload.order ?? Object.keys(payload.tables)).filter((n) => shapes.has(n));
  const results: RestoreResult[] = [];
  let total = 0;
  for (const name of order) {
    const shape = shapes.get(name);
    const delegate = shape ? delegateFor(name) : null;
    const rows = payload.tables[name] ?? [];
    if (!shape || !delegate) {
      results.push({ model: name, rows: rows.length, inserted: 0, skipped: true });
      continue;
    }
    // إسقاط أي مفاتيح غير قياسيّة (حماية من ملفّات معدّلة يدويًّا).
    const allowed = new Set(shape.scalars.map((s) => s.name));
    const clean = rows
      .filter((r) => r && typeof r === "object")
      .map((r) => Object.fromEntries(Object.entries(r).filter(([k]) => allowed.has(k))));
    let inserted = 0;
    try {
      for (let i = 0; i < clean.length; i += 500) {
        const chunk = clean.slice(i, i + 500);
        if (chunk.length === 0) continue;
        const res = await delegate.createMany({ data: chunk, skipDuplicates: true });
        inserted += res.count;
      }
    } catch (e) {
      results.push({
        model: name,
        rows: rows.length,
        inserted,
        error: e instanceof Error ? e.message.split("\n")[0].slice(0, 200) : "FAILED",
      });
      continue;
    }
    total += inserted;
    results.push({ model: name, rows: rows.length, inserted });
  }
  return { results, total };
}
