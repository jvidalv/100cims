import path from "node:path";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../.."),
  serverExternalPackages: ["geoip-lite"],
  async redirects() {
    return [
      // Permanent host move: fescims.com is the canonical domain.
      // Everything served from the legacy host bounces to the new host,
      // EXCEPT /api/* (old app binaries still call the API via the legacy
      // domain; a 301 would drop auth headers on the redirect) and
      // internal paths like /_next/* and /.well-known/*.
      {
        source: "/:path((?!api/|_next/|\\.well-known/).*)",
        has: [{ type: "host", value: "cims-sempre-amunt.app" }],
        destination: "https://fescims.com/:path",
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
