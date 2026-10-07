import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Prisma CLI does not load Next.js' `.env.local` by itself. Use it only in
// development; production must use the hosting provider's DATABASE_URL.
if (process.env.NODE_ENV !== "production") {
  config({ path: ".env.local", override: true });
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "node prisma/seed.mjs",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
