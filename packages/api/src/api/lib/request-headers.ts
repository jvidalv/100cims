import { type AppLocale, normalizeAppLocale } from "@/api/lib/locale";

export const APP_HEADER = {
  PLATFORM: "x-app-platform",
  VERSION: "x-app-version",
  LATITUDE: "x-app-latitude",
  LONGITUDE: "x-app-longitude",
  LOCALE: "x-app-locale",
} as const;

export const resolveLocaleFromRequest = (request: Request): AppLocale =>
  normalizeAppLocale(request.headers.get(APP_HEADER.LOCALE));

const ALLOWED_PLATFORMS = new Set(["ios", "android", "web"]);
const VERSION_RE = /^\d+\.\d+\.\d+$/;
const LAT_RE = /^-?\d{1,2}(\.\d+)?$/;
const LON_RE = /^-?\d{1,3}(\.\d+)?$/;

const roundTo2dp = (n: number): number => Math.round(n * 100) / 100;

export const resolvePlatformFromRequest = (request: Request): string | null => {
  const v = request.headers.get(APP_HEADER.PLATFORM)?.toLowerCase();
  return v && ALLOWED_PLATFORMS.has(v) ? v : null;
};

export const resolveAppVersionFromRequest = (
  request: Request,
): string | null => {
  const v = request.headers.get(APP_HEADER.VERSION)?.trim();
  return v && VERSION_RE.test(v) ? v : null;
};

export const resolveCoordinatesFromRequest = (
  request: Request,
): { latitude: string; longitude: string } | null => {
  const lat = request.headers.get(APP_HEADER.LATITUDE)?.trim();
  const lon = request.headers.get(APP_HEADER.LONGITUDE)?.trim();
  if (!lat || !lon || !LAT_RE.test(lat) || !LON_RE.test(lon)) return null;

  const latNum = Number(lat);
  const lonNum = Number(lon);
  if (Math.abs(latNum) > 90 || Math.abs(lonNum) > 180) return null;

  return {
    latitude: roundTo2dp(latNum).toFixed(2),
    longitude: roundTo2dp(lonNum).toFixed(2),
  };
};
