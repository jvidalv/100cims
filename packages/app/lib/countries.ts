// Curated shipping-country list. ISO 3166-1 alpha-2 codes are the
// persisted value (canonical, locale-independent). The picker renders a
// localized name + flag emoji based on the user's app locale; admin sees
// the same fields plus the raw code in the Discord/email payload.
//
// Scope: EU + neighbors + countries we've shipped to before. Ordered
// alphabetically by English name so consumers can render as-is and rely
// on the picker's own search for fast access.

export type CountryCode = string;

export type Country = {
  code: CountryCode;
  emoji: string;
  ca: string;
  es: string;
  en: string;
};

export const COUNTRIES: readonly Country[] = [
  { code: "AD", emoji: "🇦🇩", ca: "Andorra", es: "Andorra", en: "Andorra" },
  { code: "AR", emoji: "🇦🇷", ca: "Argentina", es: "Argentina", en: "Argentina" },
  { code: "AT", emoji: "🇦🇹", ca: "Àustria", es: "Austria", en: "Austria" },
  { code: "AU", emoji: "🇦🇺", ca: "Austràlia", es: "Australia", en: "Australia" },
  { code: "BE", emoji: "🇧🇪", ca: "Bèlgica", es: "Bélgica", en: "Belgium" },
  { code: "BG", emoji: "🇧🇬", ca: "Bulgària", es: "Bulgaria", en: "Bulgaria" },
  { code: "BR", emoji: "🇧🇷", ca: "Brasil", es: "Brasil", en: "Brazil" },
  { code: "CA", emoji: "🇨🇦", ca: "Canadà", es: "Canadá", en: "Canada" },
  { code: "CH", emoji: "🇨🇭", ca: "Suïssa", es: "Suiza", en: "Switzerland" },
  { code: "CL", emoji: "🇨🇱", ca: "Xile", es: "Chile", en: "Chile" },
  { code: "CO", emoji: "🇨🇴", ca: "Colòmbia", es: "Colombia", en: "Colombia" },
  { code: "CY", emoji: "🇨🇾", ca: "Xipre", es: "Chipre", en: "Cyprus" },
  { code: "CZ", emoji: "🇨🇿", ca: "Txèquia", es: "Chequia", en: "Czechia" },
  { code: "DE", emoji: "🇩🇪", ca: "Alemanya", es: "Alemania", en: "Germany" },
  { code: "DK", emoji: "🇩🇰", ca: "Dinamarca", es: "Dinamarca", en: "Denmark" },
  { code: "EE", emoji: "🇪🇪", ca: "Estònia", es: "Estonia", en: "Estonia" },
  { code: "ES", emoji: "🇪🇸", ca: "Espanya", es: "España", en: "Spain" },
  { code: "FI", emoji: "🇫🇮", ca: "Finlàndia", es: "Finlandia", en: "Finland" },
  { code: "FR", emoji: "🇫🇷", ca: "França", es: "Francia", en: "France" },
  { code: "GB", emoji: "🇬🇧", ca: "Regne Unit", es: "Reino Unido", en: "United Kingdom" },
  { code: "GR", emoji: "🇬🇷", ca: "Grècia", es: "Grecia", en: "Greece" },
  { code: "HR", emoji: "🇭🇷", ca: "Croàcia", es: "Croacia", en: "Croatia" },
  { code: "HU", emoji: "🇭🇺", ca: "Hongria", es: "Hungría", en: "Hungary" },
  { code: "IE", emoji: "🇮🇪", ca: "Irlanda", es: "Irlanda", en: "Ireland" },
  { code: "IL", emoji: "🇮🇱", ca: "Israel", es: "Israel", en: "Israel" },
  { code: "IS", emoji: "🇮🇸", ca: "Islàndia", es: "Islandia", en: "Iceland" },
  { code: "IT", emoji: "🇮🇹", ca: "Itàlia", es: "Italia", en: "Italy" },
  { code: "JP", emoji: "🇯🇵", ca: "Japó", es: "Japón", en: "Japan" },
  { code: "LI", emoji: "🇱🇮", ca: "Liechtenstein", es: "Liechtenstein", en: "Liechtenstein" },
  { code: "LT", emoji: "🇱🇹", ca: "Lituània", es: "Lituania", en: "Lithuania" },
  { code: "LU", emoji: "🇱🇺", ca: "Luxemburg", es: "Luxemburgo", en: "Luxembourg" },
  { code: "LV", emoji: "🇱🇻", ca: "Letònia", es: "Letonia", en: "Latvia" },
  { code: "MA", emoji: "🇲🇦", ca: "Marroc", es: "Marruecos", en: "Morocco" },
  { code: "MC", emoji: "🇲🇨", ca: "Mònaco", es: "Mónaco", en: "Monaco" },
  { code: "MT", emoji: "🇲🇹", ca: "Malta", es: "Malta", en: "Malta" },
  { code: "MX", emoji: "🇲🇽", ca: "Mèxic", es: "México", en: "Mexico" },
  { code: "NL", emoji: "🇳🇱", ca: "Països Baixos", es: "Países Bajos", en: "Netherlands" },
  { code: "NO", emoji: "🇳🇴", ca: "Noruega", es: "Noruega", en: "Norway" },
  { code: "NZ", emoji: "🇳🇿", ca: "Nova Zelanda", es: "Nueva Zelanda", en: "New Zealand" },
  { code: "PE", emoji: "🇵🇪", ca: "Perú", es: "Perú", en: "Peru" },
  { code: "PL", emoji: "🇵🇱", ca: "Polònia", es: "Polonia", en: "Poland" },
  { code: "PT", emoji: "🇵🇹", ca: "Portugal", es: "Portugal", en: "Portugal" },
  { code: "RO", emoji: "🇷🇴", ca: "Romania", es: "Rumanía", en: "Romania" },
  { code: "RS", emoji: "🇷🇸", ca: "Sèrbia", es: "Serbia", en: "Serbia" },
  { code: "SE", emoji: "🇸🇪", ca: "Suècia", es: "Suecia", en: "Sweden" },
  { code: "SI", emoji: "🇸🇮", ca: "Eslovènia", es: "Eslovenia", en: "Slovenia" },
  { code: "SK", emoji: "🇸🇰", ca: "Eslovàquia", es: "Eslovaquia", en: "Slovakia" },
  { code: "SM", emoji: "🇸🇲", ca: "San Marino", es: "San Marino", en: "San Marino" },
  { code: "TR", emoji: "🇹🇷", ca: "Turquia", es: "Turquía", en: "Turkey" },
  { code: "UA", emoji: "🇺🇦", ca: "Ucraïna", es: "Ucrania", en: "Ukraine" },
  { code: "US", emoji: "🇺🇸", ca: "Estats Units", es: "Estados Unidos", en: "United States" },
  { code: "UY", emoji: "🇺🇾", ca: "Uruguai", es: "Uruguay", en: "Uruguay" },
  { code: "VA", emoji: "🇻🇦", ca: "Ciutat del Vaticà", es: "Ciudad del Vaticano", en: "Vatican City" },
];

const BY_CODE = new Map(COUNTRIES.map((c) => [c.code, c]));

export const getCountryByCode = (code: string | null | undefined): Country | undefined => {
  if (!code) return undefined;
  return BY_CODE.get(code.toUpperCase());
};

// Pick the localized name based on the app locale. Falls back to English
// when the locale is anything else (so untranslated locales still render
// readable names rather than the code).
export const getCountryName = (
  country: Country,
  locale: string,
): string => {
  if (locale.startsWith("ca")) return country.ca;
  if (locale.startsWith("es")) return country.es;
  return country.en;
};

// Convenience for the most common consumer: format "🇪🇸 Espanya" for a
// given code + locale, or `null` when the code is unknown / missing.
export const formatCountryLabel = (
  code: string | null | undefined,
  locale: string,
): string | null => {
  const country = getCountryByCode(code);
  if (!country) return null;
  return `${country.emoji} ${getCountryName(country, locale)}`;
};
