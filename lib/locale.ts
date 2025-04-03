import { ca } from "date-fns/locale/ca";
import { enIN } from "date-fns/locale/en-IN";
import { es } from "date-fns/locale/es";
import { getLocales } from "expo-localization";

const VALID_LOCALES = ["en", "ca", "es"];

export const getLocale = () => {
  const locales = getLocales();
  const firstLanguageCode = locales?.[0]?.languageCode;

  if (firstLanguageCode && VALID_LOCALES.includes(firstLanguageCode)) {
    return firstLanguageCode;
  }

  return "en";
};

export const getDateFnsLocale = () => {
  const locale = getLocale();

  if (locale === "es") return es;
  if (locale === "ca") return ca;

  return enIN;
};
