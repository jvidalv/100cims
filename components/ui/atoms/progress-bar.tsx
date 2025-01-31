import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from "react-native-reanimated";
import { twMerge } from "tailwind-merge";

type Props = {
  progress: number; // Progress value between 0 and 100
  label?: string;
  className?: string;
  intent?: "primary" | "success";
};

export const ProgressBar = ({
  progress,
  intent = "primary",
  className,
}: Props) => {
  const progressValue = useSharedValue(0);

  useEffect(() => {
    progressValue.value = withDelay(
      200,
      withSpring(progress > 100 ? 100 : progress, {
        damping: 15,
        stiffness: 120,
      }),
    );
  }, [progress, progressValue]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value}%`,
  }));

  return (
    <View
      className={twMerge(
        "h-6 w-full overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-800",
        className,
      )}
    >
      <Animated.View
        style={animatedStyle}
        className={twMerge(
          "h-full",
          intent === "primary" && "bg-blue-500",
          intent === "success" && "bg-green-500",
        )}
      />
    </View>
  );
};
