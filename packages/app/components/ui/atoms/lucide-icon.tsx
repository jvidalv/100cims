import { useColorScheme } from "nativewind";
import { StyleProp, ViewStyle } from "react-native";

import { Colors } from "@/constants/colors";

import type { LucideIcon as LucideIconType } from "lucide-react-native";

interface Props {
  icon: LucideIconType;
  size?: number;
  color?: string;
  muted?: boolean;
  primary?: boolean;
  strokeWidth?: number;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export function LucideIcon({
  icon: Icon,
  size = 24,
  color,
  muted,
  primary,
  strokeWidth,
  className,
  style,
}: Props) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const tint =
    color ??
    (primary
      ? Colors[isDark ? "dark" : "light"].primary
      : muted
        ? isDark
          ? "#737373"
          : "#a3a3a3"
        : isDark
          ? "white"
          : "black");
  return (
    <Icon
      size={size}
      color={tint}
      strokeWidth={strokeWidth}
      className={className}
      style={style}
    />
  );
}
