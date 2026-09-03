import { prisma } from "@/lib/prisma";

export type DbTableStat = { table: string; rows: number | null; sizeBytes: number | null };
export type DbProvider = "Neon" | "Local" | "Other" | "Unknown";

export type DbInfo = {
  ok: boolean;
  latencyMs: number | null;
  error?: string;
  host: string | null;
  port: string | null;
  database: string | null;
  user: string | null;
  /** نفس رابط الاتصال لكن بكلمة مرور مُخفاة — آمن للعرض في اللوحة. */
  maskedUrl: string;
  provider: DbProvider;
  version?: string;
  sizeBytes?: number | null;
  sizePretty?: string;
  counts?: Record<string, number>;
  tables?: DbTableStat[];
};

/** تُخفي كلمة المرور (وأي بيانات اعتماد) قبل العرض — لا تعرض الرابط الخام أبدًا. */
export function maskDbUrl(raw: string | undefined): string {
  if (!raw) return "—";
  try {
    const u = new URL(raw);
    if (u.password) u.password = "***";
    // أخفِ اسم المستخدم أيضًا إن كان غير افتراضي؟ نُبقيه — لازم لتشخيص أي قاعدة.
    return u.toString();
  } catch {
    return raw.replace(/:\/\/([^:/?#]+):[^@/?#]*@/, "://$1:***@");
  }
}

function parseDbUrl(raw: string | undefined) {
  try {
    if (!raw) return { host: null, port: null, database: null, user: null };
    const u = new URL(raw);
    return {
      host: u.hostname || null,
      port: u.port || null,
      database: decodeURIComponent(u.pathname.replace(/^\//, "").split("?")[0]) || null,
      user: decodeURIComponent(u.username) || null,
    };
  } catch {
    return { host: null, port: null, database: null, user: null };
  }
}

function detectProvider(host: string | null): DbProvider {
  if (!host) return "Unknown";
  if (host.includes("neon.tech")) return "Neon";
  if (host === "localhost" || host === "127.0.0.1" || host === "::1") return "Local";
  return "Other";
}

export function formatBytes(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n < 1024) return `${n} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let v = n / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(1)} ${units[i]}`;
}

/**
 * معلومات قاعدة البيانات الحالية: الاتصال (مُخفى)، الحجم، وأهم الجداول.
 * لا ترمي استثناءً أبدًا — عند تعذّر الاتصال ترجع ok:false مع رسالة الخطأ،
 * لتظهر اللوحة حالة الفشل بدل صفحة 500.
 */
export async function getDbInfo(): Promise<DbInfo> {
  const raw = process.env.POSTGRES_PRISMA_URL;
  const { host, port, database, user } = parseDbUrl(raw);
  const base: DbInfo = {
    ok: false,
    latencyMs: null,
    host,
    port,
    database,
    user,
    maskedUrl: maskDbUrl(raw),
    provider: detectProvider(host),
  };

  const started = Date.now();
  try {
    const meta = await prisma.$queryRaw<
      { version: string; database: string; dbuser: string; size: bigint }[]
    >`SELECT version() AS version, current_database() AS database, current_user AS dbuser, pg_database_size(current_database()) AS size`;
    const latencyMs = Date.now() - started;
    const m = meta[0];
    const sizeBytes = m?.size != null ? Number(m.size) : null;

    // عدّادات دقيقة لأهم الكيانات (تُتجاهل أي وحدة تفشل).
    const wanted: [string, () => Promise<number>][] = [
      ["المستخدمون", () => prisma.user.count()],
      ["الطلاب", () => prisma.user.count({ where: { role: "STUDENT" } })],
      ["الصفحات", () => prisma.page.count()],
      ["المقرّرات", () => prisma.course.count()],
      ["الأخبار", () => prisma.newsItem.count()],
      ["المدفوعات", () => prisma.payment.count()],
    ];
    const counts: Record<string, number> = {};
    await Promise.all(
      wanted.map(async ([label, fn]) => {
        try {
          counts[label] = await fn();
        } catch {
          /* يُترك بدون عدّاد */
        }
      })
    );

    // أكبر الجداول حجمًا (عدد الصفوف تقديري من reltuples).
    let tables: DbTableStat[] = [];
    try {
      const rows = await prisma.$queryRaw<{ table: string; rows: bigint | null; size: bigint | null }[]>`
        SELECT relname AS table, reltuples::bigint AS rows, pg_total_relation_size(oid) AS size
        FROM pg_class
        WHERE relkind = 'r' AND relnamespace = 'public'::regnamespace
        ORDER BY pg_total_relation_size(oid) DESC
        LIMIT 15`;
      tables = rows.map((r) => ({
        table: r.table,
        rows: r.rows != null ? Number(r.rows) : null,
        sizeBytes: r.size != null ? Number(r.size) : null,
      }));
    } catch {
      /* الحجم الكلي يكفي */
    }

    return {
      ...base,
      ok: true,
      latencyMs,
      version: m?.version?.split(" ").slice(0, 2).join(" ") ?? undefined,
      database: m?.database ?? database,
      user: m?.dbuser ?? user,
      sizeBytes,
      sizePretty: formatBytes(sizeBytes),
      counts,
      tables,
    };
  } catch (e) {
    return {
      ...base,
      ok: false,
      latencyMs: Date.now() - started,
      error: e instanceof Error ? e.message.split("\n")[0].slice(0, 300) : String(e).slice(0, 300),
    };
  }
}
