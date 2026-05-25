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
  | "danger"
  | "gold"
  | "accent";

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
  gold: {
    bg: "bg-yellow-100 dark:bg-yellow-900/40",
    text: "text-yellow-600 dark:text-yellow-500",
    iconColor: "#eab308",
  },
  accent: {
    bg: "bg-accent/10",
    text: "text-accent",
    iconColor: Colors.light.accent,
  },
};

export type ActionRowSize = "sm" | "lg";

const SIZE_STYLES: Record<
  ActionRowSize,
  { row: string; circle: string; icon: number; text: string }
> = {
  sm: { row: "gap-2", circle: "size-8", icon: 16, text: "" },
  lg: {
    row: "gap-3 py-2",
    circle: "size-12",
    icon: 20,
    text: "text-base font-semibold",
  },
};

type Props = {
  icon: LucideIcon;
  intent?: ActionRowIntent;
  size?: ActionRowSize;
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
      size = "sm",
      iconSize,
      badge,
      iconOverride,
      trailing,
      children,
      className,
      disabled,
      ...props
    },
    ref,
  ) => {
    const styles = INTENT_STYLES[intent];
    const sizing = SIZE_STYLES[size];

    return (
      <TouchableOpacity
        ref={ref}
        disabled={disabled}
        className={twMerge(
          "flex-row items-center",
          sizing.row,
          disabled && "opacity-50",
          className,
        )}
        {...props}
      >
        <View
          className={twMerge(
            "relative items-center justify-center rounded-full",
            sizing.circle,
            styles.bg,
          )}
        >
          {iconOverride ?? (
            <LucideIconView
              icon={icon}
              size={iconSize ?? sizing.icon}
              color={styles.iconColor}
            />
          )}
          {badge && (
            <View className="absolute -right-0.5 -top-0.5 size-3 rounded-full bg-primary" />
          )}
        </View>
        <ThemedText className={twMerge(sizing.text, styles.text)}>
          {children}
        </ThemedText>
        {trailing}
      </TouchableOpacity>
    );
  },
);

ActionRow.displayName = "ActionRow";
