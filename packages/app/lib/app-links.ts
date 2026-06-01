/**
 * Canonical URLs used across the mobile app. Mirrors packages/api/src/lib/app-links.ts.
 *
 * SITE_URL is the primary marketing/web domain. Older installed app versions
 * still have the legacy domain baked in and reach it via 301 redirect — new
 * builds should always use SITE_URL directly so Google sees fresh links on
 * the canonical host.
 */
export const SITE_URL = "https://fescims.com";

export const IOS_APP_URL =
  "https://apps.apple.com/us/app/100cims/id6740161401";

export const ANDROID_APP_URL =
  "https://play.google.com/store/apps/details?id=app.x100cims.x100cims";

export const INSTAGRAM_URL = "https://instagram.com/fescims";

export const TIKTOK_URL = "https://tiktok.com/@fescims";

export const YOUTUBE_URL = "https://www.youtube.com/@fescims";

export const WHATSAPP_COMMUNITY_URL =
  "https://chat.whatsapp.com/ILaALMt70nW9ym6DdG2rFL";
