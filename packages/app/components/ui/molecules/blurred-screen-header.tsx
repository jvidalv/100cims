import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { PropsWithChildren, ReactNode } from "react";
import { TouchableOpacity, View } from "react-native";

import { BlurView, ThemedText } from "@/components/ui/atoms";
import { LucideIcon } from "@/components/ui/atoms/lucide-icon";
import { hasDynamicIsland } from "@/lib/device";

// Header total height in points. Tweak these freely — they're plain numbers
// fed straight to the View's style prop, no NativeWind/Tailwind compilation
// involved.
const HEADER_HEIGHT = 96;
const HEADER_HEIGHT_DYNAMIC_ISLAND = 120;

/**
 * Pixel value (number) matching the header's total height. Consumers use it
 * as `paddingTop` (via the `style` prop) on the first content element so it
 * clears the absolute-positioned bar.
 *
 *     <View style={{ paddingTop: BLURRED_SCREEN_HEADER_HEIGHT, ... }} />
 */
export const BLURRED_SCREEN_HEADER_HEIGHT = hasDynamicIsland
  ? HEADER_HEIGHT_DYNAMIC_ISLAND
  : HEADER_HEIGHT;

/**
 * Blurred top header for screens that need a translucent bar at the top —
 * the Summit and Comments tabs of a mountain detail page, which visually
 * echo the collapsed state of `ParallaxScrollView`'s header.
 *
 * Absolute-positioned; consumers pad their content with
 * `BLURRED_SCREEN_HEADER_HEIGHT` so the first item sits below the bar.
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
      className="absolute top-0 w-full flex-1"
      // Height + stacking via style props — plain numbers, no NativeWind
      // compilation gotchas. zIndex/elevation keep this above later
      // absolute siblings on iOS / Android respectively.
      style={{
        height: BLURRED_SCREEN_HEADER_HEIGHT,
        zIndex: 10,
        elevation: 10,
      }}
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
          <View className="mx-auto pb-3 text-center">
            {/* Plain string children get the standard header title styling
                automatically; pass a node to fully control the rendering. */}
            {typeof children === "string" ? (
              <ThemedText
                numberOfLines={1}
                className="max-w-56 text-lg font-medium"
              >
                {children}
              </ThemedText>
            ) : (
              children
            )}
          </View>
          <View className="w-1/5 items-end pr-6">{rightElement}</View>
        </View>
      </BlurView>
    </View>
  );
};
