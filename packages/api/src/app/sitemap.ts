import type { MetadataRoute } from "next";

import { CHALLENGE_CONTENT } from "@/app/challenges/content";
import { SITE_URL } from "@/lib/app-links";
import { getActiveMerch } from "@/lib/merch-helpers";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const challengePages: MetadataRoute.Sitemap = Object.keys(
    CHALLENGE_CONTENT,
  ).map((slug) => ({
    url: `${SITE_URL}/challenges/${slug}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const merch = await getActiveMerch();
  const merchPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/shop`, changeFrequency: "weekly", priority: 0.6 },
    ...merch.map((m) => ({
      url: `${SITE_URL}/shop/${m.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];

  return [
    { url: `${SITE_URL}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/100cims`, changeFrequency: "weekly", priority: 0.9 },
    ...challengePages,
    ...merchPages,
    {
      url: `${SITE_URL}/privacy-policy`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/terms-of-service`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    { url: `${SITE_URL}/contact`, changeFrequency: "yearly", priority: 0.5 },
  ];
}
