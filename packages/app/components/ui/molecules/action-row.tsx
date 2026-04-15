import { forwardRef, ReactNode } from "react";
import { TouchableOpacity, TouchableOpacityProps, View } from "react-native";
import { twMerge } from "tailwind-merge";

import { LucideIcon as LucideIconView, ThemedText } from "@/components/ui/atoms";
import { Colors } from "@/constants/colors";

import type { LucideIcon } from "lucide-react-native";

export type ActionRowIntent =
  | "primary"
  | "muted"
  | "blue"
  | "emerald"
  | "danger";

const INTENT_STYLES: Record<
  ActionRowIntent,
  { bg: string; text: string; iconColor?: string }
> = {
  primary: {
    bg: "bg-primary/10",
    text: "text-primary",
    iconColor: Colors.light.primary,
  },
  muted: {
    bg: "bg-gray-200 dark:bg-gray-700",
    text: "text-muted-foreground",
  },
  blue: {
    bg: "bg-blue-100 dark:bg-blue-900",
    text: "text-blue-500 dark:text-blue-400",
    iconColor: "#3b82f6",
  },
  emerald: {
    bg: "bg-emerald-100 dark:bg-emerald-900",
    text: "text-emerald-500",
    iconColor: "#10b981",
  },
  danger: {
    bg: "bg-red-100 dark:bg-red-950",
    text: "text-red-500",
    iconColor: "#ef4444",
  },
};

type Props = {
  icon: LucideIcon;
  intent?: ActionRowIntent;
  iconSize?: number;
  badge?: boolean;
  iconOverride?: ReactNode;
  trailing?: ReactNode;
  children: ReactNode;
} & TouchableOpacityProps;

export const ActionRow = forwardRef<View, Props>(
  (
    {
      icon,
      intent = "muted",
      iconSize = 16,
      badge,
      iconOverride,
      trailing,
      children,
      className,
      ...props
    },
    ref,
  ) => {
    const styles = INTENT_STYLES[intent];

    return (
      <TouchableOpacity
        ref={ref}
        className={twMerge("flex-row items-center gap-2", className)}
        {...props}
      >
        <View
          className={twMerge(
            "relative size-8 items-center justify-center rounded-full",
            styles.bg,
          )}
        >
          {iconOverride ?? (
            <LucideIconView
              icon={icon}
              size={iconSize}
              color={styles.iconColor}
            />
          )}
          {badge && (
            <View className="absolute -right-0.5 -top-0.5 size-3 rounded-full bg-primary" />
          )}
        </View>
        <ThemedText className={styles.text}>{children}</ThemedText>
        {trailing}
      </TouchableOpacity>
    );
  },
);

ActionRow.displayName = "ActionRow";
