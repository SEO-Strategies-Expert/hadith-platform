import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Prisma CLI does not load Next.js' `.env.local` by itself. Prefer it for
// local commands so `prisma db push`, seeds, and the Next.js app use one DB.
config({ path: ".env.local", override: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "node prisma/seed.mjs",
  },
  datasource: {
    url: env("POSTGRES_PRISMA_URL"),
  },
});
