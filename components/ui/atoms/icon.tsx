// This file is a fallback for using MaterialIcons on Android and web.
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { SymbolWeight } from "expo-symbols";
import { AnimationSpec } from "expo-symbols/build/SymbolModule.types";
import { useColorScheme } from "nativewind";
import React from "react";
import { OpaqueColorValue, StyleProp, TextStyle } from "react-native";

// Add your SFSymbol to MaterialCommunityIcons mappings here.
const MAPPING = {
  // See MaterialCommunityIcons here: https://icons.expo.fyi
  // See SF Symbols in the SF Symbols app on Mac.
  "sun.max.fill": "white-balance-sunny",
  "moon.fill": "weather-night",
  "info.circle.fill": "information",
  "arrow.forward": "arrow-right",
  "arrow.backward": "arrow-left",
  "mountain.2.fill": "summit",
  "checkmark.seal.fill": "check-decagram",
  "map.circle.fill": "map-search",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "list.bullet": "format-list-bulleted",
  magnifyingglass: "magnify",
  "arrow.right": "arrow-right",
  camera: "camera",
  "person.fill": "account",
  "medal.fill": "medal",
  calendar: "calendar",
  xmark: "window-close",
  plus: "plus",
  "lock.fill": "lock",
  "checkmark.square.fill": "checkbox-marked",
  square: "checkbox-blank-outline",
  hourglass: "timer-sand",
  "arrow.left.arrow.right": "arrow-u-left-bottom",
  "text.bubble": "chat-processing",
  "eurosign.circle.fill": "chess-king",
  trash: "trash-can-outline",
  star: "star",
  "start.fill": "star",
  "person.3.fill": "account-group",
  "house.circle": "home-circle-outline",
  "square.and.arrow.up": "share",
  "square.and.pencil": "circle-edit-outline",
  gear: "cog",
  "arrow.down": "arrow-down",
  "bubble.left.and.text.bubble.right": "chat-processing-outline",
  paperplane: "send",
  "questionmark.circle": "account-question",
  backpack: "bag-personal-outline",
  "backpack.fill": "bag-personal",
  "arrowshape.up.fill": "arrow-up-thick",
  "map.fill": "map-outline",
  "location.fill": "map-marker-distance",
} as Partial<
  Record<
    import("expo-symbols").SymbolViewProps["name"],
    React.ComponentProps<typeof MaterialCommunityIcons>["name"]
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
  const { colorScheme } = useColorScheme();
  let finalColor = color;
  if (!color) {
    finalColor = colorScheme === "dark" ? "white" : "black";
  }

  return (
    <MaterialCommunityIcons
      size={size}
      color={finalColor}
      style={[style, muted ? { opacity: 0.7 } : {}]}
      name={MAPPING[name]}
      className={className}
    />
  );
}
