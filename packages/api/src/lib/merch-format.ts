import type { AppLocale } from "@/api/lib/locale";
import type { MerchRow } from "@/lib/merch-helpers";

const CURRENCY_LOCALE: Record<AppLocale, string> = {
  ca: "ca-ES",
  es: "es-ES",
  en: "en-US",
};

export const localizeMerch = (row: MerchRow, locale: AppLocale) => ({
  name:
    (locale === "ca" && row.nameCa) ||
    (locale === "es" && row.nameEs) ||
    row.nameEn,
  description:
    (locale === "ca" && row.descriptionCa) ||
    (locale === "es" && row.descriptionEs) ||
    row.descriptionEn ||
    "",
});

export const formatPrice = (euros: number, locale: AppLocale): string =>
  new Intl.NumberFormat(CURRENCY_LOCALE[locale], {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
  }).format(euros);
