import { forwardRef } from "react";
import {
  TouchableOpacity,
  Text,
  TouchableOpacityProps,
  View,
} from "react-native";
import { twMerge } from "tailwind-merge";
import { tv, type VariantProps } from "tailwind-variants";

import { ActivityIndicator } from "@/components/ui/atoms/activity-indicator";
import { Icon, IconSymbolName } from "@/components/ui/atoms/icon";

const buttonVariants = tv({
  base: "flex-row items-center justify-center gap-2 rounded-xl border-2 border-transparent p-4",
  variants: {
    intent: {
      primary: "bg-primary",
      accent: "bg-accent",
      success: "bg-green-500",
      outline: "border-border bg-background",
      danger: "bg-red-500",
    },
    disabled: {
      true: "opacity-70",
    },
  },
  defaultVariants: {
    intent: "primary",
  },
});

type Props = VariantProps<typeof buttonVariants> & {
  isLoading?: boolean;
  iconName?: IconSymbolName;
} & TouchableOpacityProps;

export const Button = forwardRef<View, Props>(
  (
    {
      children,
      intent,
      disabled,
      isLoading,
      iconName,
      onPress,
      className,
      ...props
    },
    ref,
  ) => {
    const variants = buttonVariants({ intent, disabled });

    return (
      <TouchableOpacity
        className={twMerge(variants, className)}
        onPress={onPress}
        disabled={disabled || isLoading}
        ref={ref}
        {...props}
      >
        {iconName && (
          <View className={twMerge(isLoading && "opacity-0")}>
            <Icon color="white" name={iconName} size={28} />
          </View>
        )}
        {isLoading && (
          <View className="absolute w-full">
            <ActivityIndicator />
          </View>
        )}
        <Text
          className={twMerge(
            "text-xl font-semibold text-white",
            isLoading && "opacity-0",
          )}
        >
          {children}
        </Text>
      </TouchableOpacity>
    );
  },
);
