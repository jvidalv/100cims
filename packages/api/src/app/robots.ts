import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/app-links";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/protected", "/api/cron"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
