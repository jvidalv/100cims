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
  success?: boolean;
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
  success,
  strokeWidth,
  className,
  style,
}: Props) {
  const { colorScheme } = useColorScheme();
  const themeColors = Colors[colorScheme === "dark" ? "dark" : "light"];
  const resolveTint = () => {
    if (color) return color;
    if (primary) return themeColors.primary;
    if (success) return themeColors.success;
    if (muted) return themeColors.muted;
    return themeColors.foreground;
  };
  const tint = resolveTint();
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
