import { useRef, useState } from "react";
import { FormattedMessage } from "react-intl";
import { LayoutChangeEvent, Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
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
  buttonLabels?: [string, string];
};

export const ThemedToggleInput = ({
  label,
  checked,
  onChecked,
  defaultChecked,
  className,
  buttonLabels,
}: Props) => {
  const isUncontrolled = defaultChecked !== undefined;
  const [uncontrolledChecked, setUncontrolledChecked] =
    useState(defaultChecked);
  const internalChecked = isUncontrolled ? uncontrolledChecked : checked;

  const containerWidth = useRef<number>(0);

  const onLayout = (event: LayoutChangeEvent) => {
    containerWidth.current = event.nativeEvent.layout.width;
    if (!internalChecked) {
      translateX.value = (event.nativeEvent.layout.width - 13) / 2;
    }
  };

  const translateX = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    const color = internalChecked
      ? "rgba(59, 130, 246, 0.2)"
      : "rgba(239, 68, 68, 0.2)";

    return {
      borderColor: color,
      backgroundColor: color,
      transform: [
        {
          translateX: withSpring(translateX.value, {
            damping: 20,
            stiffness: 90,
          }),
        },
      ],
    };
  });

  const toggle = () => {
    if (isUncontrolled) {
      setUncontrolledChecked(!internalChecked);
    }
    onChecked?.(!internalChecked);
    translateX.value = internalChecked ? (containerWidth.current - 13) / 2 : 0;
  };

  return (
    <Pressable
      onPress={toggle}
      className={twMerge(
        "border-2 border-border justify-between rounded-xl p-1.5 relative flex-row",
        className,
      )}
      onLayout={onLayout}
    >
      {!!label && (
        <ThemedView className="absolute -top-3 left-4 z-10 -mx-1 bg-background px-1">
          <ThemedText
            className="text-muted-foreground"
            style={{ fontSize: 14, lineHeight: 15 }}
          >
            {label}
          </ThemedText>
        </ThemedView>
      )}
      <Animated.View
        className="absolute m-1.5 h-full w-1/2 rounded-lg border-2 border-border"
        style={animatedStyle}
      />
      <View className="flex-1 items-center justify-center p-4">
        <ThemedText>
          {buttonLabels?.[0] || <FormattedMessage defaultMessage="Yes" />}
        </ThemedText>
      </View>
      <View className="flex-1 items-center justify-center p-4">
        <ThemedText>
          {buttonLabels?.[1] || <FormattedMessage defaultMessage="No" />}
        </ThemedText>
      </View>
    </Pressable>
  );
};
