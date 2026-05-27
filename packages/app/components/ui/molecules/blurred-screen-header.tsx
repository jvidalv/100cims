import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { PropsWithChildren, ReactNode } from "react";
import { TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BlurView, ThemedText } from "@/components/ui/atoms";
import { LucideIcon } from "@/components/ui/atoms/lucide-icon";

// Height of the title row + a bit of breathing room below it. Sized to fit
// the back-arrow TouchableOpacity (28pt icon + py-4 = 60pt) plus the row's
// own `pb-3`. The header's total height becomes `insets.top + ROW_AREA`,
// so Android with a ~24dp status bar gets a ~76dp band instead of the
// iOS-tuned 96; iPhone-notch lands at 44+52=96 which matches the old
// constant exactly. The row pins to the bottom of the band via `mt-auto`,
// so the title sits flush with the bottom edge on every platform.
const ROW_AREA = 52;

/**
 * Hook returning the header's total height in points (status-bar inset +
 * title row). Consumers use it as `paddingTop` (via the `style` prop) on
 * the first content element below the absolute-positioned bar.
 *
 *     const headerHeight = useBlurredScreenHeaderHeight();
 *     <ScrollView contentContainerStyle={{ paddingTop: headerHeight, ... }} />
 *
 * Implemented as a hook rather than a constant because the status bar
 * height varies per platform: ~44pt on iPhone notch, ~54pt on Dynamic
 * Island, ~24dp on Android. Hardcoding any one of those leaves the others
 * with either clipped content (too short) or a tab-bar-sized gap (too tall).
 */
export const useBlurredScreenHeaderHeight = (): number => {
  const insets = useSafeAreaInsets();
  return insets.top + ROW_AREA;
};

/**
 * Blurred top header for screens that need a translucent bar at the top —
 * the Summit and Comments tabs of a mountain detail page, which visually
 * echo the collapsed state of `ParallaxScrollView`'s header.
 *
 * Absolute-positioned; consumers pad their content with
 * `useBlurredScreenHeaderHeight()` so the first item sits below the bar.
 *
 * API mirrors `ScreenHeader` (children = title, optional `rightElement`).
 */
export const BlurredScreenHeader = ({
  children,
  rightElement,
}: PropsWithChildren<{ rightElement?: ReactNode }>) => {
  const router = useRouter();
  const height = useBlurredScreenHeaderHeight();

  return (
    <View
      className="absolute top-0 w-full flex-1"
      style={{ height, zIndex: 10, elevation: 10 }}
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
