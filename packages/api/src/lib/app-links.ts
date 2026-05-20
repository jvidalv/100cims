export const SITE_URL = "https://fescims.com";

/**
 * The legacy domain is still attached to the same service and 301-redirects
 * everything except `/api/*`, `/_next/*`, and `/.well-known/*` to SITE_URL.
 * Kept here so we can reference it in redirect rules and docs.
 */
export const LEGACY_SITE_URL = "https://cims-sempre-amunt.app";

export const IOS_APP_URL =
  "https://apps.apple.com/app/100cims/id6740161401?platform=iphone";

export const ANDROID_APP_URL =
  "https://play.google.com/store/apps/details?id=app.x100cims.x100cims";

export const INSTAGRAM_URL = "https://instagram.com/fescims";

export const TIKTOK_URL = "https://tiktok.com/@fescims";

export type Platform = "ios" | "android" | "other";

export const detectPlatform = (userAgent: string): Platform => {
  if (/iPhone|iPad|iPod/i.test(userAgent)) return "ios";
  if (/Android/i.test(userAgent)) return "android";
  return "other";
};

export const resolveStoreUrl = (platform: Platform): string => {
  if (platform === "ios") return IOS_APP_URL;
  if (platform === "android") return ANDROID_APP_URL;
  return SITE_URL;
};
