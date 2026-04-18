import {
  DISCORD_COLOR,
  DISCORD_ERRORS_WEBHOOK_URL,
  sendDiscordEmbed,
  truncate,
} from "@/api/lib/discord";
import {
  resolveAppVersionFromRequest,
  resolvePlatformFromRequest,
} from "@/api/lib/request-headers";

export const MAX_IMAGE_KB = 3072;

const getBase64SizeInKB = (base64Data: string): number =>
  Buffer.byteLength(base64Data, "base64") / 1024;

export const isBase64SizeValid = (
  base64Data: string,
  maxSizeInKB: number = MAX_IMAGE_KB,
): boolean => getBase64SizeInKB(base64Data) <= maxSizeInKB;

/**
 * Fire-and-forget Discord alert for payloads that breached the image size
 * cap after client-side compression. These represent genuine outliers — if
 * one fires routinely we should revisit the compression defaults.
 */
export const reportImageTooBig = (
  request: Request,
  {
    route,
    base64Data,
    userId,
  }: { route: string; base64Data: string; userId?: string },
) => {
  const sizeInKB = Math.round(getBase64SizeInKB(base64Data));
  const platform = resolvePlatformFromRequest(request) ?? "unknown";
  const appVersion = resolveAppVersionFromRequest(request) ?? "unknown";

  sendDiscordEmbed(DISCORD_ERRORS_WEBHOOK_URL, {
    title: "Image too big",
    color: DISCORD_COLOR.YELLOW,
    fields: [
      { name: "Route", value: truncate(route, 200), inline: true },
      { name: "Size", value: `${sizeInKB} KB`, inline: true },
      { name: "Limit", value: `${MAX_IMAGE_KB} KB`, inline: true },
      { name: "Platform", value: platform, inline: true },
      { name: "App version", value: appVersion, inline: true },
      ...(userId
        ? [{ name: "User", value: truncate(userId, 40), inline: true }]
        : []),
    ],
  });
};
