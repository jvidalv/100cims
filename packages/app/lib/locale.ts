import { ca } from "date-fns/locale/ca";
import { enIN } from "date-fns/locale/en-IN";
import { es } from "date-fns/locale/es";
import { getLocales } from "expo-localization";

const VALID_LOCALES = ["en", "ca", "es"];

// Locale doesn't change without an app restart; memoize the native bridge call.
let cachedLocale: string | undefined;

export const getLocale = () => {
  if (cachedLocale !== undefined) return cachedLocale;
  const locales = getLocales();
  const firstLanguageCode = locales?.[0]?.languageCode;
  cachedLocale =
    firstLanguageCode && VALID_LOCALES.includes(firstLanguageCode)
      ? firstLanguageCode
      : "en";
  return cachedLocale;
};

export const getDateFnsLocale = () => {
  const locale = getLocale();

  if (locale === "es") return es;
  if (locale === "ca") return ca;

  return enIN;
};
