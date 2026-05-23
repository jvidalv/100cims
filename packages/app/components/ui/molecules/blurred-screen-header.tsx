import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { PropsWithChildren, ReactNode } from "react";
import { TouchableOpacity, View } from "react-native";
import { twMerge } from "tailwind-merge";

import { BlurView } from "@/components/ui/atoms";
import { LucideIcon } from "@/components/ui/atoms/lucide-icon";
import { hasDynamicIsland } from "@/lib/device";

// Band height. Larger on Dynamic Island devices to leave clear breathing
// room between the island and the row of back-button + title, since the row
// is bottom-aligned via mt-auto.
const HEIGHT_CLASSNAME = "h-24";
const HEIGHT_CLASSNAME_DYNAMIC_ISLAND = "h-48";

/**
 * Tailwind class names matching the header's total height. Screens that
 * render `<BlurredScreenHeader />` should add this as `pt-…` to their content
 * so the first visible item sits below the absolute-positioned bar.
 *
 *     const headerOffset = blurredScreenHeaderPaddingClassName();
 *     <ScrollView contentContainerClassName={`${headerOffset} ...`} />
 */
export const blurredScreenHeaderPaddingClassName = (): string =>
  hasDynamicIsland ? "pt-48" : "pt-24";

/**
 * Blurred top header for screens that need a translucent bar at the top —
 * the Summit and Comments tabs of a mountain detail page, which visually
 * echo the collapsed state of `ParallaxScrollView`'s header.
 *
 * Structurally identical to ParallaxScrollView's internal collapsed Header
 * (copied verbatim) so the visual continuity is exact. Absolute-positioned;
 * consumers pad their content with `blurredScreenHeaderPaddingClassName()`.
 *
 * API mirrors `ScreenHeader` (children = title, optional `rightElement`).
 */
export const BlurredScreenHeader = ({
  children,
  rightElement,
}: PropsWithChildren<{ rightElement?: ReactNode }>) => {
  const router = useRouter();

  return (
    <View
      className={twMerge(
        "absolute top-0 w-full flex-1",
        HEIGHT_CLASSNAME,
        hasDynamicIsland && HEIGHT_CLASSNAME_DYNAMIC_ISLAND,
      )}
      // zIndex/elevation keep the header above any later-rendered absolute
      // siblings on iOS and Android respectively.
      style={{ zIndex: 10, elevation: 10 }}
    >
      <BlurView className="flex-1">
        <View className="mt-auto flex-row items-center justify-between">
          <TouchableOpacity
            onPress={router.back}
            hitSlop={16}
            className="-mt-3 w-1/5 py-4 pl-6 pr-4"
          >
            <LucideIcon size={28} icon={ChevronLeft} />
          </TouchableOpacity>
          <View className="mx-auto pb-3 text-center">{children}</View>
          <View className="w-1/5">{rightElement}</View>
        </View>
      </BlurView>
    </View>
  );
};
