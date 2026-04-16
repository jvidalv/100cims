import AsyncStorage from "@react-native-async-storage/async-storage";
import { ca } from "date-fns/locale/ca";
import { enIN } from "date-fns/locale/en-IN";
import { es } from "date-fns/locale/es";
import { getLocales } from "expo-localization";
import * as Updates from "expo-updates";

export type Locale = "en" | "ca" | "es";

const VALID_LOCALES = ["en", "ca", "es"] as const;
const LOCALE_STORAGE_KEY = "locale";

const isLocale = (value: string | null | undefined): value is Locale =>
  !!value && (VALID_LOCALES as readonly string[]).includes(value);

// Locale doesn't change without an app restart; memoize the native bridge call.
let cachedLocale: Locale | undefined;

const resolveDeviceLocale = (): Locale => {
  const firstLanguageCode = getLocales()?.[0]?.languageCode;
  return isLocale(firstLanguageCode) ? firstLanguageCode : "en";
};

/**
 * Must run at app startup before the first render that reads `getLocale()`.
 * Seeds the memoized cache from AsyncStorage, falling back to device locale.
 */
export const initLocale = async (): Promise<void> => {
  try {
    const stored = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
    if (isLocale(stored)) {
      cachedLocale = stored;
      return;
    }
  } catch {
    // fall through to device locale on storage read failure
  }
  cachedLocale = resolveDeviceLocale();
};

export const getLocale = (): Locale => {
  if (cachedLocale !== undefined) return cachedLocale;
  cachedLocale = resolveDeviceLocale();
  return cachedLocale;
};

/**
 * Persist the user's choice and reload the app so the IntlProvider and
 * date-fns default options pick up the new value. `getLocale` remains sync
 * and memoized, so a full JS reload is the simplest way to flip everything.
 */
export const setLocale = async (locale: Locale): Promise<void> => {
  await AsyncStorage.setItem(LOCALE_STORAGE_KEY, locale);
  await Updates.reloadAsync();
};

export const getDateFnsLocale = () => {
  const locale = getLocale();

  if (locale === "es") return es;
  if (locale === "ca") return ca;

  return enIN;
};
