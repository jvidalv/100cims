import {
  Image as ExpoImage,
  type ImageProps as ExpoImageProps,
} from "expo-image";
import {
  type ImageProps as RNImageProps,
  type ImageStyle as RNImageStyle,
  type StyleProp,
} from "react-native";
import { styled } from "react-native-css";

/**
 * App-wide `<Image>` chokepoint backed by `expo-image`. We route every image
 * render through this single component so we can swap the underlying
 * implementation in one place — and because `react-native`'s built-in
 * `<Image>` causes Android `Canvas: trying to use a recycled bitmap` crashes
 * when NativeTabs detaches/reattaches a tab subtree. `expo-image` (Glide on
 * Android, SDWebImage on iOS) manages bitmap lifecycle correctly across
 * detach/reattach.
 *
 * The prop surface intentionally mirrors `react-native`'s `<Image>` so
 * callsites can drop `import { Image } from "react-native"` for our wrapper
 * unchanged. The shim below translates legacy props:
 *   - `resizeMode` → `contentFit` (also lifts `style.resizeMode` out of the
 *     style object, since `expo-image` only honors `contentFit` at the top
 *     level)
 *   - `source.cache` → `cachePolicy`
 * and defaults `cachePolicy` to `memory-disk` so cached images load
 * instantly and survive app restarts.
 *
 * `StyledExpoImage` is `ExpoImage` wrapped with NativeWind's `styled()` so
 * `className` from Tailwind compiles into the `style` prop on the native
 * view. Without this, NativeWind doesn't know about `expo-image` and every
 * `className` (corners, sizes, backgrounds) silently drops.
 *
 * Static methods (`Image.prefetch`, `Image.getSize`, `Image.resolveAssetSource`)
 * are NOT re-exposed here — callers that need them import the raw
 * `react-native` `Image` directly. See `image-preview-modal.tsx` and
 * `lib/share.ts` for the pattern.
 */
const StyledExpoImage = styled(ExpoImage);

type Props = Omit<ExpoImageProps, "source" | "style"> & {
  resizeMode?: RNImageProps["resizeMode"];
  source: RNImageProps["source"] | ExpoImageProps["source"];
  style?: StyleProp<RNImageStyle>;
  className?: string;
};

const RESIZE_MODE_TO_CONTENT_FIT: Record<
  NonNullable<RNImageProps["resizeMode"]>,
  NonNullable<ExpoImageProps["contentFit"]>
> = {
  cover: "cover",
  contain: "contain",
  stretch: "fill",
  center: "none",
  none: "none",
  repeat: "cover",
};

export function Image({
  source,
  resizeMode,
  contentFit,
  cachePolicy,
  style,
  ...rest
}: Props) {
  // Lift the RN-style `cache` hint out of `source` and forward it as
  // `cachePolicy`. Default to `memory-disk` so first render after launch
  // hits disk instead of refetching, and subsequent renders hit memory.
  let resolvedCachePolicy = cachePolicy ?? "memory-disk";
  let resolvedSource = source;
  if (
    source &&
    typeof source === "object" &&
    !Array.isArray(source) &&
    "uri" in source &&
    "cache" in source
  ) {
    const { cache: rnCacheHint, ...withoutCache } = source;
    resolvedSource = withoutCache;
    // RN's `cache: "force-cache"` ≈ expo-image's `memory-disk` (prefer cache
    // over network). RN's `reload` ≈ none (always refetch). Anything else
    // falls back to our default.
    if (cachePolicy === undefined) {
      if (rnCacheHint === "force-cache" || rnCacheHint === "only-if-cached") {
        resolvedCachePolicy = "memory-disk";
      } else if (rnCacheHint === "reload") {
        resolvedCachePolicy = "none";
      }
    }
  }

  // `style.resizeMode` is RN-only and silently ignored by `expo-image`.
  // Hoist it into our top-level `resizeMode` (which we then map to
  // `contentFit`) so legacy callers that put it in style still work.
  let liftedResizeMode: RNImageProps["resizeMode"] = resizeMode;
  let resolvedStyle: StyleProp<RNImageStyle> = style;
  if (
    style &&
    typeof style === "object" &&
    !Array.isArray(style) &&
    "resizeMode" in style &&
    style.resizeMode
  ) {
    const { resizeMode: fromStyle, ...rest } = style;
    liftedResizeMode =
      liftedResizeMode ?? (fromStyle as RNImageProps["resizeMode"]);
    resolvedStyle = rest;
  }

  const resolvedContentFit =
    contentFit ??
    (liftedResizeMode
      ? RESIZE_MODE_TO_CONTENT_FIT[liftedResizeMode]
      : undefined);

  return (
    <StyledExpoImage
      {...rest}
      style={resolvedStyle as ExpoImageProps["style"]}
      source={resolvedSource as ExpoImageProps["source"]}
      contentFit={resolvedContentFit}
      cachePolicy={resolvedCachePolicy}
    />
  );
}
