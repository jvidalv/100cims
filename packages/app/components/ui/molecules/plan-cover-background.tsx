import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui/atoms";
import { Image } from "@/components/ui/atoms/image";
import { getInitials } from "@/lib/strings";

type Props = {
  /** Custom plan cover image — if set, this is rendered full-bleed.
   *  Otherwise the collage (or initials fallback) is shown. */
  customImageUrl?: string | null;
  mountains?: { imageUrl?: string | null }[];
  /** Used for the initials fallback when neither a custom image nor any
   *  mountain image is available. */
  title: string;
  /** When `true`, the dark gradient at the bottom is rendered on top of
   *  the image (used by the row components so the title-bar copy stays
   *  legible). The picker's preview turns this off. */
  withBottomGradient?: boolean;
  /** Square-style initials when the parent is a small fixed-size square
   *  (row thumbnails). Set `false` to scale the initials larger for
   *  banner-sized covers. */
  initialsSize?: "sm" | "lg";
};

/**
 * Shared cover-image renderer for plans. Single source of truth for the
 * "custom photo → mountain collage → title initials" precedence. The
 * caller positions it (give it a sized parent or use `flex: 1`); this
 * component just fills.
 */
export const PlanCoverBackground = ({
  customImageUrl,
  mountains,
  title,
  withBottomGradient = true,
  initialsSize = "lg",
}: Props) => {
  if (customImageUrl) {
    return (
      <>
        <Image
          source={{ uri: customImageUrl, cache: "force-cache" }}
          className="bg-neutral-300 dark:bg-neutral-800"
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
        {withBottomGradient && <CoverGradient />}
      </>
    );
  }

  const imageUrls =
    mountains
      ?.map((m) => m.imageUrl)
      .filter((url): url is string => !!url) ?? [];
  if (imageUrls.length > 0) {
    return (
      <>
        <View className="flex-row" style={StyleSheet.absoluteFill}>
          {imageUrls.slice(0, 4).map((imageUrl, i, arr) => {
            const count = arr.length;
            if (count === 1) {
              return (
                <Image
                  key={imageUrl}
                  source={{ uri: imageUrl, cache: "force-cache" }}
                  className="absolute bg-neutral-300 dark:bg-neutral-800"
                  style={{ width: "100%", height: "100%" }}
                />
              );
            }
            if (count === 2) {
              return (
                <Image
                  key={imageUrl}
                  source={{ uri: imageUrl, cache: "force-cache" }}
                  className="bg-neutral-300 dark:bg-neutral-800"
                  style={{ width: "50%", height: "100%" }}
                />
              );
            }
            // 3 cells: the third tile spans the full bottom row.
            // 4 cells: a 2×2 grid.
            const hasOnlyThree = count === 3;
            const isLast = i === count - 1;
            const positionStyle =
              i === 0
                ? { top: 0, left: 0 }
                : i === 1
                  ? { top: 0, right: 0 }
                  : i === 2
                    ? { bottom: 0, left: 0 }
                    : { bottom: 0, right: 0 };
            return (
              <Image
                key={imageUrl}
                source={{ uri: imageUrl, cache: "force-cache" }}
                className="absolute bg-neutral-300 dark:bg-neutral-800"
                style={{
                  width: hasOnlyThree && isLast ? "100%" : "50%",
                  height: "50%",
                  ...positionStyle,
                }}
              />
            );
          })}
        </View>
        {withBottomGradient && <CoverGradient />}
      </>
    );
  }

  // Initials fallback — same warm tone the row component used so the
  // picker's empty state matches what'll actually render on a plan with
  // no image and no mountains.
  return (
    <View
      className="items-center justify-center"
      style={[StyleSheet.absoluteFill, { backgroundColor: "#ffd097" }]}
    >
      <ThemedText
        className={
          initialsSize === "sm"
            ? "text-sm font-bold text-background"
            : "text-4xl text-background"
        }
      >
        {getInitials(title)}
      </ThemedText>
    </View>
  );
};

const CoverGradient = () => (
  <View className="absolute bottom-0 size-full">
    <LinearGradient
      colors={["transparent", "transparent", "transparent", "rgba(0,0,0,0.4)"]}
      style={StyleSheet.absoluteFill}
    />
  </View>
);
