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
