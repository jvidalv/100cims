import { Hourglass } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { Animated } from "react-native";
import { twMerge } from "tailwind-merge";

import { LucideIcon } from "@/components/ui/atoms/lucide-icon";

type SpinnerProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
  color?: string;
};

export function ActivityIndicator({
  size = "md",
  className,
  color,
}: SpinnerProps) {
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [spinAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const sizeMap = {
    sm: 16,
    md: 24,
    lg: 32,
  };

  const iconSize = sizeMap[size];

  return (
    <Animated.View
      style={{
        transform: [{ rotate: spin }],
      }}
      className={twMerge("justify-center items-center", className)}
    >
      <LucideIcon icon={Hourglass} color={color} size={iconSize} />
    </Animated.View>
  );
}
