const APP_LOCALE_MAP: Record<string, AppLocale | undefined> = {
  en: "en",
  ca: "ca",
  es: "es",
};

export type AppLocale = "en" | "ca" | "es";

export const normalizeAppLocale = (
  raw: string | null | undefined,
): AppLocale => {
  if (!raw) return "en";
  const short = raw.trim().toLowerCase().split(/[-_]/)[0];
  return APP_LOCALE_MAP[short] ?? "en";
};
