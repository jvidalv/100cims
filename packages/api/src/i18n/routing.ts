import { defineRouting } from "next-intl/routing";

import type { AppLocale } from "@/api/lib/locale";

export const SUPPORTED_LOCALES = [
  "en",
  "ca",
  "es",
] as const satisfies readonly AppLocale[];

export const routing = defineRouting({
  locales: SUPPORTED_LOCALES,
  defaultLocale: "en",
  localePrefix: "always",
});
