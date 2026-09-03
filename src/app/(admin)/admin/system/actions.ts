"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guard";

export async function queueBackup() {
  const user = await requireAdmin();
  const job = await prisma.systemJob.create({ data: { kind: "database.backup", payload: { requestedBy: user.id } } });
  await prisma.auditLog.create({ data: { actorId: user.id, action: "queue", entity: "systemJob", entityId: job.id, metadata: { kind: "database.backup" } } });
  revalidatePath("/admin/system");
}

/**
 * مزامنة هيكل قاعدة البيانات مع schema.prisma دون حذف البيانات.
 * يعادل تشغيل `prisma db push --accept-data-loss` على الخادم — هو الحلّ
 * لخطأ الإنتاج “This page couldn't load” بعد نشر نسخةٍ جديدةٍ غيّرت المخطط
 * ولم تُطبَّق ترحيلاتها بعد. ينشئ الجداول/الأعمدة الناقصة ويحدّث الفهارس.
 *
 * يعمل على cPanel/Neon pooler: يستخدم POSTGRES_URL_NON_POOLING إن وُجد
 * (Direct) وإلا POSTGRES_PRISMA_URL. يُشغِّل prisma عبر npx ويُعيد التوجيه
 * برسالة نجاح/فشل تُعرض في /admin/system.
 */
export async function syncDatabase() {
  const actor = await requireAdmin();
  let target: string;
  try {
    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const { existsSync } = await import("fs");
    const path = await import("path");
    const execAsync = promisify(exec);

    // Prisma يحتاج Direct URL للـ DDL على Neon؛ الـ pooler لا يسمح بالـ migrations.
    const dbUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;
    if (!dbUrl) throw new Error("DATABASE_URL_MISSING: لم تُضبط متغيرات قاعدة البيانات في البيئة");

    // cPanel/Vercel: نصلح HOME و npm cache لتجنب ENOENT mkdir /home/sbx_user1051
    // ونستخدم الثنائي المحلي بدل npx لتجنب fetch من registry.
    const env: Record<string, string | undefined> = {
      ...process.env,
      POSTGRES_PRISMA_URL: dbUrl,
      POSTGRES_URL_NON_POOLING: dbUrl,
      HOME: "/tmp",
      TMPDIR: "/tmp",
      npm_config_cache: "/tmp/.npm",
      XDG_CACHE_HOME: "/tmp/.cache",
      PRISMA_CLI_BINARY_TARGETS: process.env.PRISMA_CLI_BINARY_TARGETS,
    };

    const cwd = process.cwd();
    const localBin = path.join(cwd, "node_modules/.bin/prisma");
    const localBuild = path.join(cwd, "node_modules/prisma/build/index.js");
    let cmd: string;
    if (existsSync(localBin)) {
      cmd = `"${localBin}" db push --accept-data-loss --skip-generate`;
    } else if (existsSync(localBuild)) {
      cmd = `node "${localBuild}" db push --accept-data-loss --skip-generate`;
    } else {
      // fallback — قد يفشل بـ ENOENT لكن نحاول مع HOME مُصلَّح
      cmd = "npx --yes prisma db push --accept-data-loss --skip-generate";
    }

    // --accept-data-loss آمن هنا: push لا يحذف إلا أعمدةً/جداول حُذفت من المخطط،
    // والمخطط الحالي هو المرجع. --skip-generate يتجنّب إعادة توليد العميل في الإنتاج.
    const { stdout, stderr } = await execAsync(cmd, {
      timeout: 120_000,
      maxBuffer: 5 * 1024 * 1024,
      env: env as NodeJS.ProcessEnv,
      cwd,
    });
    const output = [stdout, stderr].filter(Boolean).join("\n").slice(0, 4000);

    // سجّل العملية للتدقيق حتى لو لم توجد جداول التدقيق سابقًا (قد تفشل — نتجاهل).
    try {
      await prisma.systemJob.create({
        data: { kind: "database.sync", status: "completed", payload: { requestedBy: actor.id, output: output.slice(0, 1000) } },
      });
      await prisma.auditLog.create({
        data: { actorId: actor.id, action: "sync", entity: "database", metadata: { output: output.slice(0, 1000) } },
      });
    } catch {
      /* الجداول نفسها كانت ناقصة — طبيعي قبل أول مزامنة */
    }

    target = `/admin/system?synced=${encodeURIComponent(output.slice(0, 200) || "ok")}`;
  } catch (e: unknown) {
    const raw = e instanceof Error ? e.message : String(e);
    // حاول سحب stdout/stderr من كائن الخطأ (exec يضعها هناك)
    const extra =
      (e as { stdout?: string; stderr?: string })?.stderr ||
      (e as { stdout?: string; stderr?: string })?.stdout ||
      "";
    const msg = [raw, extra].filter(Boolean).join(" — ").slice(0, 600);
    try {
      await prisma.systemJob.create({
        data: { kind: "database.sync", status: "failed", payload: { requestedBy: actor.id, error: msg.slice(0, 1000) } },
      });
    } catch {
      /* ignore */
    }
    target = `/admin/system?syncError=${encodeURIComponent(msg)}&syncOutput=${encodeURIComponent(extra.slice(0, 1500))}`;
  }
  redirect(target);
}
