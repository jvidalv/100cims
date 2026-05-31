import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { PropsWithChildren, ReactNode } from "react";
import { TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BlurView, ThemedText } from "@/components/ui/atoms";
import { LucideIcon } from "@/components/ui/atoms/lucide-icon";

// Height of the title row itself. Sized to fit the back-arrow
// TouchableOpacity (28pt icon + py-4 = 60pt) plus the row's own `pb-3`.
const ROW_AREA = 52;
// Gap between the bottom edge of the bar and the first row of consumer
// content. Baked into the hook (rather than left to each caller) so every
// `BlurredScreenHeader` screen gets the same breathing room without a
// `paddingTop: headerHeight + 12` boilerplate at every call site.
const CONTENT_GAP = 12;

/**
 * Visible height of the bar itself (status-bar inset + title row) — what
 * an overlapping collapsed parallax header should match. Use
 * `useBlurredScreenHeaderHeight()` instead when you're padding scroll
 * content; that variant adds a few pt of breathing room below the bar.
 */
export const useBlurredScreenHeaderBarHeight = (): number => {
  const insets = useSafeAreaInsets();
  return insets.top + ROW_AREA;
};

/**
 * Hook returning the bar's height + a small content gap, sized for use as
 * `paddingTop` on the first scrollable below the absolute-positioned bar.
 * iPhone-notch lands at 44+52+12=108; Android lands at 24+52+12=88;
 * Dynamic Island at 54+52+12=118.
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
  return useBlurredScreenHeaderBarHeight() + CONTENT_GAP;
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
  const barHeight = useBlurredScreenHeaderBarHeight();

  return (
    <View
      className="absolute top-0 w-full flex-1"
      style={{ height: barHeight, zIndex: 10, elevation: 10 }}
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
