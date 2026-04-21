import type { MetadataRoute } from "next";

import { CHALLENGE_CONTENT } from "@/app/challenges/content";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/app-links";
import { getActiveMerch } from "@/lib/merch-helpers";

const localized = (
  path: string,
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
  priority: number,
  lastModified?: Date,
): MetadataRoute.Sitemap =>
  routing.locales.map((locale) => ({
    url: `${SITE_URL}/${locale}${path}`,
    changeFrequency,
    priority,
    lastModified,
  }));

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const merch = await getActiveMerch();
  const now = new Date();

  const homePages = localized("", "monthly", 1, now);
  const shopListPages = localized("/shop", "weekly", 0.6, now);
  const shopDetailPages: MetadataRoute.Sitemap = merch.flatMap((m) =>
    localized(`/shop/${m.slug}`, "monthly", 0.5, m.createdAt),
  );
  const contactPages = localized("/contact", "yearly", 0.5, now);

  const legacyChallengePages: MetadataRoute.Sitemap = Object.keys(
    CHALLENGE_CONTENT,
  ).map((slug) => ({
    url: `${SITE_URL}/challenges/${slug}`,
    changeFrequency: "weekly",
    priority: 0.7,
    lastModified: now,
  }));

  return [
    ...homePages,
    {
      url: `${SITE_URL}/100cims`,
      changeFrequency: "weekly",
      priority: 0.9,
      lastModified: now,
    },
    {
      url: `${SITE_URL}/three-peaks`,
      changeFrequency: "weekly",
      priority: 0.9,
      lastModified: now,
    },
    ...legacyChallengePages,
    ...shopListPages,
    ...shopDetailPages,
    ...contactPages,
    {
      url: `${SITE_URL}/privacy-policy`,
      changeFrequency: "yearly",
      priority: 0.3,
      lastModified: now,
    },
    {
      url: `${SITE_URL}/terms-of-service`,
      changeFrequency: "yearly",
      priority: 0.3,
      lastModified: now,
    },
  ];
}
