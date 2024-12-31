// This file is a fallback for using MaterialIcons on Android and web.
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight } from "expo-symbols";
import { AnimationSpec } from "expo-symbols/build/SymbolModule.types";
import React from "react";
import { OpaqueColorValue, StyleProp, TextStyle } from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";

// Add your SFSymbol to MaterialIcons mappings here.
const MAPPING = {
  // See MaterialIcons here: https://icons.expo.fyi
  // See SF Symbols in the SF Symbols app on Mac.
  "person.fill": "person",
  "list.bullet": "format-list-bulleted",
  "chevron.left": "chevron-left",
  "chevron.right": "chevron-right",
  "info.circle": "info-outline",
  "mountain.2": "directions-walk",
  magnifyingglass: "search",
  xmark: "close",
  "mappin.and.ellipse": "location-pin",
  "rectangle.portrait.and.arrow.right": "logout",
  plus: "add",
  camera: "camera-alt",
  hourglass: "hourglass-top",
} as Partial<
  Record<
    import("expo-symbols").SymbolViewProps["name"],
    React.ComponentProps<typeof MaterialIcons>["name"]
  >
>;

export type IconSymbolName = keyof typeof MAPPING;

/**
 * An icon component that uses native SFSymbols on iOS, and MaterialIcons on Android and web. This ensures a consistent look across platforms, and optimal resource usage.
 *
 * Icon `name`s are based on SFSymbols and require manual mapping to MaterialIcons.
 */
export function Icon({
  name,
  size = 24,
  className,
  color,
  style,
  muted,
}: {
  name: IconSymbolName;
  size?: number;
  color?: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  className?: string;
  weight?: SymbolWeight;
  muted?: boolean;
  animationSpec?: AnimationSpec;
}) {
  const { isDark } = useColorScheme();
  let finalColor = color;
  if (!color) {
    finalColor = isDark ? "white" : "black";
  }

  return (
    <MaterialIcons
      size={size}
      color={finalColor}
      style={[style, muted ? { opacity: 0.7 } : {}]}
      name={MAPPING[name]}
      className={className}
    />
  );
}
