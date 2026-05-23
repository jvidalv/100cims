import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { PropsWithChildren, ReactNode } from "react";
import { TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BlurView } from "@/components/ui/atoms";
import { LucideIcon } from "@/components/ui/atoms/lucide-icon";

// Height of the interactive row (back button / title / right element).
// Status-bar inset is added on top via useSafeAreaInsets() so the row never
// collides with the notch / dynamic island / time row, regardless of device.
const ROW_HEIGHT = 48;

/**
 * Total height the header occupies on the current device, including the
 * status-bar safe-area inset. Use this from consumers to pad content below
 * the absolute-positioned header (e.g. `paddingTop: useBlurredScreenHeaderHeight()`).
 */
export const useBlurredScreenHeaderHeight = (): number => {
  const { top } = useSafeAreaInsets();
  return top + ROW_HEIGHT;
};

/**
 * Blurred top header matching the collapsed state of ParallaxScrollView's
 * header. Use this on screens that should visually continue from a parallax
 * screen — most notably the Summit and Comments tabs of a mountain detail
 * page, so swapping tabs preserves the "collapsed parallax" look.
 *
 * Absolute-positioned; consumers must pad their content using
 * `useBlurredScreenHeaderHeight()` so it flows below the header rather than
 * underneath it.
 *
 * Same JSX as ParallaxScrollView's internal collapsed Header used to be —
 * ParallaxScrollView now imports this component to stay in sync.
 *
 * API mirrors `ScreenHeader` (children = title, optional `rightElement`).
 */
export const BlurredScreenHeader = ({
  children,
  rightElement,
}: PropsWithChildren<{ rightElement?: ReactNode }>) => {
  const router = useRouter();
  const { top } = useSafeAreaInsets();

  return (
    <View
      className="absolute top-0 w-full"
      style={{ paddingTop: top, height: top + ROW_HEIGHT }}
    >
      <BlurView className="flex-1">
        <View
          className="flex-row items-center justify-between"
          style={{ height: ROW_HEIGHT }}
        >
          <TouchableOpacity
            onPress={router.back}
            hitSlop={16}
            className="h-full w-1/5 items-start justify-center pl-6"
          >
            <LucideIcon size={28} icon={ChevronLeft} />
          </TouchableOpacity>
          <View className="mx-auto items-center justify-center">
            {children}
          </View>
          <View className="h-full w-1/5 items-end justify-center pr-6">
            {rightElement}
          </View>
        </View>
      </BlurView>
    </View>
  );
};
