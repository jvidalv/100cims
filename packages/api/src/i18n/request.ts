import { getRequestConfig } from "next-intl/server";
import { headers } from "next/headers";

const SUPPORTED = ["ca", "es", "en"] as const;
type Supported = (typeof SUPPORTED)[number];

const isSupported = (v: string): v is Supported =>
  (SUPPORTED as readonly string[]).includes(v);

const pickLocale = (acceptLanguage: string | null): Supported => {
  if (!acceptLanguage) return "en";
  const tags = acceptLanguage
    .split(",")
    .map((t) => t.split(";")[0].trim().toLowerCase().split("-")[0]);
  for (const tag of tags) {
    if (isSupported(tag)) return tag;
  }
  return "en";
};

export default getRequestConfig(async () => {
  const h = await headers();
  const locale = pickLocale(h.get("accept-language"));

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
