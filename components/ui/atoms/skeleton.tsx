import React, { useEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { twMerge } from "tailwind-merge";

export const Skeleton = ({ className }: { className?: string }) => {
  const opacity = useSharedValue(1); // Initial opacity

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.4, { duration: 1000, easing: Easing.inOut(Easing.ease) }), // Animate opacity to 0.4
      -1, // Repeat indefinitely
      true, // Reverse the animation (fades in and out)
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value, // Apply the animated opacity
  }));

  return (
    <Animated.View
      className={twMerge("w-full h-24 rounded-lg bg-border", className)}
      style={animatedStyle}
    />
  );
};
