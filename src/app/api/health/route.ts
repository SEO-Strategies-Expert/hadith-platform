import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export async function GET() {
  const started = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok", database: "ok", latencyMs: Date.now() - started, time: new Date().toISOString() }, { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({ status: "degraded", database: "unavailable", time: new Date().toISOString() }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}
