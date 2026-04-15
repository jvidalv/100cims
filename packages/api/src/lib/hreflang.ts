import type { AppLocale } from "@/api/lib/locale";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/app-links";

export interface AlternatesConfig {
  canonical: string;
  languages: Record<string, string>;
}

/**
 * Returns canonical + hreflang alternates for a locale-prefixed page.
 * `path` is the segment AFTER the locale (e.g. "/shop", "/shop/black-shirt", or "" for the home).
 * Always emits one entry per supported locale plus an `x-default` pointing at the default locale.
 */
export const getLocalizedAlternates = (
  locale: AppLocale,
  path: string,
): AlternatesConfig => {
  const normalised = path && !path.startsWith("/") ? `/${path}` : path;
  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    languages[l] = `${SITE_URL}/${l}${normalised}`;
  }
  languages["x-default"] = `${SITE_URL}/${routing.defaultLocale}${normalised}`;
  return {
    canonical: `${SITE_URL}/${locale}${normalised}`,
    languages,
  };
};
