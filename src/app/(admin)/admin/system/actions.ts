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
 * يستخدم DATABASE_URL نفسها التي يعتمد عليها Prisma schema والتطبيق، حتى لا
 * تُطبَّق المزامنة على قاعدةٍ مختلفة عن قاعدة تشغيل التطبيق. يُشغِّل Prisma
 * CLI ويُعيد التوجيه
 * برسالة نجاح/فشل تُعرض في /admin/system.
 */
export async function syncDatabase() {
  const actor = await requireAdmin();
  let target: string;
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) throw new Error("DATABASE_URL_MISSING: لم تُضبط متغيرات قاعدة البيانات في البيئة");

    let output = "";
    let cliFailed = false;
    let cliError = "";

    // 1) حاول CLI المحلي أولًا (أسرع ويعالج ALTER COLUMN أيضًا)
    try {
      const { exec } = await import("child_process");
      const { promisify } = await import("util");
      const { existsSync } = await import("fs");
      const path = await import("path");
      const execAsync = promisify(exec);
      const env: Record<string, string | undefined> = {
        ...process.env,
        DATABASE_URL: dbUrl,
        HOME: "/tmp",
        TMPDIR: "/tmp",
        npm_config_cache: "/tmp/.npm",
        XDG_CACHE_HOME: "/tmp/.cache",
      };
      const cwd = process.cwd();
      const localBin = path.join(cwd, "node_modules/.bin/prisma");
      const localBuild = path.join(cwd, "node_modules/prisma/build/index.js");
      let cmd: string;
      if (existsSync(localBin)) {
        cmd = `"${localBin}" db push --skip-generate`;
      } else if (existsSync(localBuild)) {
        cmd = `node "${localBuild}" db push --skip-generate`;
      } else {
        cmd = "npx --yes prisma db push --skip-generate";
      }
      const { stdout, stderr } = await execAsync(cmd, {
        timeout: 120_000,
        maxBuffer: 5 * 1024 * 1024,
        env: env as NodeJS.ProcessEnv,
        cwd,
      });
      output = [stdout, stderr].filter(Boolean).join("\n").slice(0, 4000);
      if (!output) output = "prisma db push — لا مخرجات، لكن لم يفشل.";
    } catch (e: unknown) {
      cliFailed = true;
      const raw = e instanceof Error ? e.message : String(e);
      const extra =
        (e as { stdout?: string; stderr?: string })?.stderr ||
        (e as { stdout?: string; stderr?: string })?.stdout ||
        "";
      cliError = [raw, extra].filter(Boolean).join(" — ").slice(0, 2000);
      // إذا لم يتوفر Prisma CLI في حزمة الاستضافة، اطلب تشغيله من الطرفية.
      const isEnginesMissing = /Cannot find module '@prisma\/engines'|Cannot find module '.*engines'|MODULE_NOT_FOUND.*engines/i.test(
        cliError
      );
      if (!isEnginesMissing && !/ENOENT.*mkdir/.test(cliError)) {
        // خطأ حقيقي غير متعلق بالـ engines — أعد رميه
        throw e;
      }
      output = `CLI فشل (${cliError.slice(0, 300)})`;
    }

    if (cliFailed) {
      throw new Error(`PRISMA_CLI_UNAVAILABLE: ${cliError || "شغّل npx prisma db push من طرفية الاستضافة."}`);
    }

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

    target = `/admin/system?synced=${encodeURIComponent(output.slice(0, 400) || "ok")}`;
  } catch (e: unknown) {
    const raw = e instanceof Error ? e.message : String(e);
    const extra =
      (e as { stdout?: string; stderr?: string })?.stderr ||
      (e as { stdout?: string; stderr?: string })?.stdout ||
      "";
    const msg = [raw, extra].filter(Boolean).join(" — ").slice(0, 800);
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
