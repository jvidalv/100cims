import {
  TouchableOpacity,
  Text,
  View,
  TouchableOpacityProps,
} from "react-native";
import { tv, type VariantProps } from "tailwind-variants";
import { FC, forwardRef, useEffect } from "react";
import { Icon, IconSymbolName } from "@/components/ui/atoms/icon";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { twMerge } from "tailwind-merge";
import type from "ajv/lib/vocabularies/jtd/type";

const buttonVariants = tv({
  base: "flex-row items-center justify-center rounded-xl",
  variants: {
    intent: {
      primary: "bg-primary",
      accent: "bg-accent",
      danger: "bg-red-500",
    },
    size: {
      small: "px-2 py-2 text-sm",
      medium: "px-4 py-3 text-base",
      large: "px-6 py-4 text-lg",
    },
    disabled: {
      true: "opacity-50",
    },
  },
  defaultVariants: {
    intent: "primary",
    size: "medium",
  },
});

type Props = VariantProps<typeof buttonVariants> & {
  isLoading?: boolean;
  iconName?: IconSymbolName;
} & TouchableOpacityProps;

export const Button = forwardRef<Animated.View, Props>(
  (
    {
      children,
      intent,
      size,
      disabled,
      isLoading,
      iconName,
      onPress,
      className,
      ...props
    },
    ref,
  ) => {
    const opacity = useSharedValue(1); // Initial opacity

    useEffect(() => {
      if (!isLoading) {
        opacity.value = 1;
        return;
      }

      opacity.value = withRepeat(
        withTiming(0.4, { duration: 1000, easing: Easing.inOut(Easing.ease) }), // Animate opacity to 0.4
        -1, // Repeat indefinitely
        true, // Reverse the animation (fades in and out)
      );
    }, [isLoading, opacity]);

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
    }));

    const variants = buttonVariants({ intent, size, disabled });

    return (
      <Animated.View ref={ref} style={animatedStyle}>
        <TouchableOpacity
          className={twMerge(variants, className)}
          onPress={onPress}
          disabled={disabled || isLoading}
          {...props}
        >
          {iconName && (
            <View className="mr-2">
              <Icon size={28} color="white" name={iconName} />
            </View>
          )}
          <Text className="text-white text-lg font-medium">{children}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  },
);
