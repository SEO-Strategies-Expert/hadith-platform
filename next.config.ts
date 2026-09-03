import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ضم ملف SQL للمزامنة في حزمة Vercel Lambda — بدونه يفشل fs.readFileSync
  outputFileTracingIncludes: {
    "/admin/system": ["./prisma/init.sql", "./src/lib/init.sql"],
    "/api/admin/db-sync": ["./prisma/init.sql", "./src/lib/init.sql"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
