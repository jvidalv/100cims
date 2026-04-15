import { forwardRef } from "react";
import {
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from "react-native";
import { twMerge } from "tailwind-merge";
import { tv, type VariantProps } from "tailwind-variants";

import { ActivityIndicator } from "@/components/ui/atoms/activity-indicator";
import { LucideIcon as LucideIconView } from "@/components/ui/atoms/lucide-icon";

import type { LucideIcon } from "lucide-react-native";

const buttonVariants = tv({
  base: "flex-row items-center justify-center gap-2 rounded border-2 border-transparent p-4",
  variants: {
    intent: {
      primary: "bg-primary",
      accent: "bg-accent",
      success: "bg-green-500",
      outline: "border-border bg-background",
      danger: "bg-red-500",
      ghost: "bg-transparent",
    },
    disabled: {
      true: "opacity-70",
    },
    loading: {
      true: "opacity-70",
    },
  },
  defaultVariants: {
    intent: "primary",
  },
});

type Props = VariantProps<typeof buttonVariants> & {
  isLoading?: boolean;
  icon?: LucideIcon;
  iconSize?: number;
  textClassName?: string;
} & TouchableOpacityProps;

export const Button = forwardRef<View, Props>(
  (
    {
      children,
      intent,
      disabled,
      isLoading,
      icon,
      iconSize = 28,
      onPress,
      className,
      textClassName,
      ...props
    },
    ref,
  ) => {
    const variants = buttonVariants({ intent, disabled, loading: isLoading });
    const iconColor = "white";
    const isOutlineOrGhost = intent === "outline" || intent === "ghost";

    return (
      <TouchableOpacity
        className={twMerge(variants, className)}
        onPress={onPress}
        disabled={disabled || isLoading}
        ref={ref}
        {...props}
      >
        {icon && (
          <View className={twMerge(isLoading && "opacity-0")}>
            <LucideIconView color={iconColor} icon={icon} size={iconSize} />
          </View>
        )}
        {isLoading && (
          <View className="absolute w-full">
            <ActivityIndicator color={iconColor} />
          </View>
        )}
        <Text
          style={{
            fontSize: 20,
            fontWeight: "600",
            color: isOutlineOrGhost ? undefined : "white",
          }}
          className={twMerge(
            isLoading && "opacity-0",
            isOutlineOrGhost && "text-foreground",
            textClassName,
          )}
        >
          {children}
        </Text>
      </TouchableOpacity>
    );
  },
);

Button.displayName = "Button";
