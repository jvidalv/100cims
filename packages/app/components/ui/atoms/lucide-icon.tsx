import { useColorScheme } from "nativewind";
import { StyleProp, ViewStyle } from "react-native";

import type { LucideIcon as LucideIconType } from "lucide-react-native";

interface Props {
  icon: LucideIconType;
  size?: number;
  color?: string;
  muted?: boolean;
  strokeWidth?: number;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export function LucideIcon({
  icon: Icon,
  size = 24,
  color,
  muted,
  strokeWidth,
  className,
  style,
}: Props) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const tint =
    color ??
    (muted ? (isDark ? "#737373" : "#a3a3a3") : isDark ? "white" : "black");
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
