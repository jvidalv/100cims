import { useColorScheme } from "nativewind";
import { StyleProp, ViewStyle } from "react-native";

import { Colors } from "@/constants/colors";

import type { LucideIcon as LucideIconType } from "lucide-react-native";

interface Props {
  icon: LucideIconType;
  size?: number;
  color?: string;
  /** Fill color for the icon's interior shape. Lucide icons are stroked
   *  by default; passing `fill` is how you get a filled star, heart, etc. */
  fill?: string;
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
  fill,
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
  // Only forward `fill` when a caller passed one. Passing `fill={undefined}`
  // explicitly makes react-native-svg fall back to the raw SVG default, which
  // is solid black — so icon interiors (trophy bowl, speech-bubble cavity,
  // mountain triangle) render filled black on top of their circular badge
  // backgrounds. Default lucide stroke icons want `fill="none"`.
  return (
    <Icon
      size={size}
      color={tint}
      {...(fill !== undefined && { fill })}
      strokeWidth={strokeWidth}
      className={className}
      style={style}
    />
  );
}
