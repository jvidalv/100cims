import { useEffect } from "react";
import { FormattedMessage } from "react-intl";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ui/atoms";

export const SharePulseBadge = () => {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.5, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={animatedStyle}
      className="rounded-full bg-primary px-2 py-0.5"
    >
      <ThemedText className="text-xs font-semibold text-white">
        <FormattedMessage defaultMessage="← on Instagram/TikTok!" />
      </ThemedText>
    </Animated.View>
  );
};
