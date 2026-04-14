import { RefObject } from "react";
import { IntlShape } from "react-intl";
import { Image, Share, View } from "react-native";
import * as Sharing from "expo-sharing";
import { captureRef } from "react-native-view-shot";

import { getUrlDeeplink } from "@/lib/deeplink";
import { logError } from "@/lib/log-error";

type Locale = "ca" | "es" | "en";

/**
 * Share a deeplink with a locale-aware message. Used across detail pages
 * (mountain, plan, user, summit, challenge) for text-only share fallbacks.
 *
 * The `messages` prop is a record keyed by locale; English is required.
 * The resolved message is suffixed with the deeplink automatically.
 */
export const shareDeeplink = async ({
  intl,
  path,
  messages,
}: {
  intl: IntlShape;
  path: string;
  messages: { en: string; ca?: string; es?: string };
}) => {
  const link = getUrlDeeplink(path);
  const localized =
    messages[intl.locale as Locale] ?? messages.en;
  await Share.share({ message: `${localized}\n\n${link}` });
};

/**
 * Capture an off-screen view (a share card) into a 1080x1920 JPEG and open
 * the native share sheet with it. Falls back to the provided text-share
 * callback if sharing is unavailable or capture fails.
 *
 * `prefetchUrls` is best-effort: failures don't abort the capture. `data:` URIs
 * are skipped automatically (no network fetch needed).
 */
export const captureAndShare = async ({
  cardRef,
  prefetchUrls,
  dialogTitle,
  fallback,
  logTag,
}: {
  cardRef: RefObject<View | null>;
  prefetchUrls: (string | null | undefined)[];
  dialogTitle: string;
  fallback: () => Promise<void>;
  logTag: string;
}) => {
  try {
    await Promise.allSettled(
      prefetchUrls
        .filter((u): u is string => !!u && !u.startsWith("data:"))
        .map((u) => Image.prefetch(u)),
    );
    const uri = await captureRef(cardRef, {
      format: "jpg",
      quality: 0.9,
      width: 1080,
      height: 1920,
      result: "tmpfile",
    });
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, {
        mimeType: "image/jpeg",
        dialogTitle,
        UTI: "public.jpeg",
      });
    } else {
      await fallback();
    }
  } catch (error) {
    logError(error, logTag);
    await fallback();
  }
};
