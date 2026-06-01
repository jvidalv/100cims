import type {
  LocalizedString,
  MountainRoute,
  TechnicalDifficulty,
  TrailType,
} from "./route.types";
import type { useIntl } from "react-intl";


type IntlShape = ReturnType<typeof useIntl>;

// Locale fallback chain: exact locale → English → Spanish → Catalan → raw.
// We pull `intl.locale` and split off the region tag ("ca-ES" → "ca"). `??`
// (not `||`) so a legitimately-empty string still falls through to the next
// fallback rather than masking the data quality issue.
const LOCALIZED_LANGS: (keyof LocalizedString)[] = ["en", "ca", "es"];

const isLocalizedLang = (lang: string): lang is keyof LocalizedString =>
  (LOCALIZED_LANGS as string[]).includes(lang);

/**
 * Pick a localized string for the user's current locale, falling back through
 * the canonical en→es→ca chain before deferring to the caller-supplied raw
 * fallback. Exposed so non-MountainRoute consumers (saved-routes list,
 * future notification payloads, etc.) can apply the same locale logic
 * without re-implementing it.
 */
export const pickLocalizedString = (
  t: LocalizedString,
  intl: IntlShape,
  fallback: string,
): string => {
  const lang = intl.locale.split(/[-_]/)[0];
  const primary = isLocalizedLang(lang) ? t[lang] : undefined;
  return primary ?? t.en ?? t.es ?? t.ca ?? fallback;
};

export const pickLocalizedTitle = (
  route: MountainRoute,
  intl: IntlShape,
): string => pickLocalizedString(route.title, intl, route.titleRaw);

// Prefer the Gemini-rewritten description in the user's locale; fall back
// to other locales then to the raw scraped prose. Returns null when there's
// nothing to show.
export const pickLocalizedDescription = (
  route: MountainRoute,
  intl: IntlShape,
): string | null => {
  const d = route.description;
  if (d) {
    // Empty-string sentinel because pickLocalizedString demands a fallback;
    // we'd rather degrade to `descriptionRaw` than render an empty paragraph.
    const localized = pickLocalizedString(d, intl, "");
    if (localized) return localized;
  }
  return route.descriptionRaw;
};

// Haversine distance in metres between two lat/lng points.
export const distanceMeters = (
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number => {
  const R = 6_371_000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLat = lat2 - lat1;
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

// True if Wikiloc reports "loop", OR the GPS track's first and last coords
// are within 150m. We always trust the geometry — even when trailType says
// "out-and-back" — because Wikiloc's authoring tools mislabel loops as
// out-and-back frequently enough that the heuristic is more reliable than
// the human-entered field.
const LOOP_CLOSE_THRESHOLD_M = 150;

export const isLoopRoute = (route: MountainRoute): boolean => {
  if (route.trailType === "loop") return true;
  if (!route.coordinates || route.coordinates.length < 2) return false;
  const first = route.coordinates[0];
  const last = route.coordinates[route.coordinates.length - 1];
  return distanceMeters(first, last) <= LOOP_CLOSE_THRESHOLD_M;
};

export const formatKm = (meters: number | null): string | null => {
  if (meters === null) return null;
  return `${(meters / 1000).toFixed(meters >= 10_000 ? 1 : 2)} km`;
};

export const formatMeters = (m: number | null): string | null =>
  m === null ? null : `${m.toLocaleString("en-US").replace(/,/g, " ")} m`;

export const formatDuration = (seconds: number | null): string | null => {
  if (seconds === null) return null;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours === 0) return `${minutes}m`;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
};

export const formatDifficulty = (
  d: TechnicalDifficulty | null,
  intl: IntlShape,
): string | null => {
  if (!d) return null;
  switch (d) {
    case "easy":
      return intl.formatMessage({ defaultMessage: "Easy" });
    case "moderate":
      return intl.formatMessage({ defaultMessage: "Moderate" });
    case "difficult":
      return intl.formatMessage({ defaultMessage: "Difficult" });
    case "very-difficult":
      return intl.formatMessage({ defaultMessage: "Very difficult" });
    case "only-experts":
      return intl.formatMessage({ defaultMessage: "Only experts" });
    default:
      return null;
  }
};

export const formatTrailType = (
  t: TrailType | null,
  intl: IntlShape,
): string | null => {
  if (!t) return null;
  switch (t) {
    case "loop":
      return intl.formatMessage({ defaultMessage: "Loop" });
    case "out-and-back":
      return intl.formatMessage({ defaultMessage: "Out & back" });
    case "one-way":
      return intl.formatMessage({ defaultMessage: "One way" });
    default:
      return null;
  }
};

// Map our scraped Wikiloc difficulty enum onto the same 5-tier red→orange→green
// scale the mountain detail uses for crowd-sourced difficulty. The Wikiloc
// scale has 5 levels (easy → only-experts); we treat them as positions 0..4
// on the same gradient, reversed so "harder" reads as red.
export const difficultyPosition = (
  d: TechnicalDifficulty,
): 0 | 1 | 2 | 3 | 4 => {
  switch (d) {
    case "easy":
      return 0;
    case "moderate":
      return 1;
    case "difficult":
      return 2;
    case "very-difficult":
      return 3;
    case "only-experts":
      return 4;
  }
};

export const difficultyChipClass = (d: TechnicalDifficulty | null): string => {
  switch (d) {
    case "easy":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
    case "moderate":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-300";
    case "difficult":
      return "bg-orange-500/15 text-orange-700 dark:text-orange-300";
    case "very-difficult":
    case "only-experts":
      return "bg-red-500/15 text-red-700 dark:text-red-300";
    default:
      return "bg-muted text-muted-foreground";
  }
};
