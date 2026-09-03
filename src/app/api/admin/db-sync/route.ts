import { requireAdmin } from "@/lib/guard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/db-sync
 * بديل واجهة برمجة للـ cPanel/CI: يمزامن الهيكل مثل زر /admin/system.
 * يتطلب جلسة مدير (cookie) — نفس حماية requireAdmin.
 * يرجع JSON { ok, output } أو { ok:false, error }.
 */
export async function POST() {
  try {
    await requireAdmin();
  } catch {
    return Response.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  const dbUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;
  if (!dbUrl) {
    return Response.json({ ok: false, error: "DATABASE_URL_MISSING" }, { status: 500 });
  }

  try {
    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const { existsSync } = await import("fs");
    const path = await import("path");
    const execAsync = promisify(exec);
    const cwd = process.cwd();
    const localBin = path.join(cwd, "node_modules/.bin/prisma");
    const localBuild = path.join(cwd, "node_modules/prisma/build/index.js");
    let cmd: string;
    if (existsSync(localBin)) {
      cmd = `"${localBin}" db push --accept-data-loss --skip-generate`;
    } else if (existsSync(localBuild)) {
      cmd = `node "${localBuild}" db push --accept-data-loss --skip-generate`;
    } else {
      cmd = "npx --yes prisma db push --accept-data-loss --skip-generate";
    }
    const env: Record<string, string | undefined> = {
      ...process.env,
      POSTGRES_PRISMA_URL: dbUrl,
      POSTGRES_URL_NON_POOLING: dbUrl,
      HOME: "/tmp",
      TMPDIR: "/tmp",
      npm_config_cache: "/tmp/.npm",
      XDG_CACHE_HOME: "/tmp/.cache",
    };
    const { stdout, stderr } = await execAsync(cmd, {
      timeout: 120_000,
      maxBuffer: 5 * 1024 * 1024,
      env: env as NodeJS.ProcessEnv,
      cwd,
    });
    const output = [stdout, stderr].filter(Boolean).join("\n").slice(0, 5000);

    try {
      await prisma.systemJob.create({
        data: { kind: "database.sync", status: "completed", payload: { via: "api", output: output.slice(0, 1000) } },
      });
    } catch {
      /* tables may not exist yet */
    }

    return Response.json({ ok: true, output });
  } catch (e: unknown) {
    const raw = e instanceof Error ? e.message : String(e);
    const extra =
      (e as { stdout?: string; stderr?: string })?.stderr ||
      (e as { stdout?: string; stderr?: string })?.stdout ||
      "";
    const error = [raw, extra].filter(Boolean).join(" — ").slice(0, 2000);
    try {
      await prisma.systemJob.create({
        data: { kind: "database.sync", status: "failed", payload: { via: "api", error: error.slice(0, 1000) } },
      });
    } catch {
      /* ignore */
    }
    return Response.json({ ok: false, error, output: extra.slice(0, 3000) }, { status: 500 });
  }
}

/** فحص سريع: هل الهيكل متزامن أم لا؟ */
export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return Response.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }
  try {
    await prisma.$queryRaw`SELECT 1`;
    // جرّب أهم جدولين — إن فشلا فالهيكل ناقص
    await prisma.user.findFirst({ select: { id: true } });
    await prisma.course.findFirst({ select: { id: true } });
    return Response.json({ ok: true, synced: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message.split("\n")[0].slice(0, 500) : String(e).slice(0, 500);
    return Response.json({ ok: true, synced: false, error: msg });
  }
}
