import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

export async function consumeRateLimit(scope: string, identity: string, limit = 8, windowMs = 15 * 60_000) {
  const digest = createHash("sha256").update(identity.trim().toLowerCase()).digest("hex");
  const key = `${scope}:${digest}`;
  const now = new Date();
  const row = await prisma.rateLimitBucket.findUnique({ where: { key } });
  if (!row || now.getTime() - row.windowStart.getTime() >= windowMs) {
    await prisma.rateLimitBucket.upsert({ where: { key }, create: { key, count: 1, windowStart: now }, update: { count: 1, windowStart: now } });
    return true;
  }
  if (row.count >= limit) return false;
  await prisma.rateLimitBucket.update({ where: { key }, data: { count: { increment: 1 } } });
  return true;
}
