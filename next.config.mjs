/** @type {import('next').NextConfig} */
const nextConfig = {
  // Include the SQL files required by the database sync routes in the build output.
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
