import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { twMerge } from "tailwind-merge";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { ThemedView } from "@/components/ui/atoms/themed-view";

type Props = {
  label?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChecked?: (checked: boolean) => void;
  className?: string;
};

export const ThemedCheckbox = ({
  label,
  checked,
  defaultChecked,
  onChecked,
  className,
}: Props) => {
  const isControlled = checked !== undefined;
  const [internalChecked, setInternalChecked] = useState(
    defaultChecked ?? false,
  );
  const checkedValue = isControlled ? checked : internalChecked;

  const scale = useSharedValue(checkedValue ? 1 : 0);

  useEffect(() => {
    scale.value = withTiming(checkedValue ? 0.8 : 0, { duration: 150 });
  }, [checkedValue, scale]);

  const handleToggle = () => {
    const newValue = !checkedValue;
    if (!isControlled) {
      setInternalChecked(newValue);
    }
    onChecked?.(newValue);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value,
  }));

  return (
    <Pressable
      onPress={handleToggle}
      className={twMerge("flex-row items-center gap-2", className)}
    >
      <View
        className={twMerge(
          "relative size-5 items-center justify-center overflow-hidden rounded-md border-2 border-border bg-background",
          checkedValue && "border-primary",
        )}
      >
        <Animated.View
          style={animatedStyle}
          className="size-full rounded bg-primary"
        />
      </View>
      {!!label && (
        <ThemedView>
          <ThemedText className="text-foreground">{label}</ThemedText>
        </ThemedView>
      )}
    </Pressable>
  );
};
