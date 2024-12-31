import { SymbolView, SymbolViewProps, SymbolWeight } from "expo-symbols";
import { AnimationSpec } from "expo-symbols/build/SymbolModule.types";
import { StyleProp, ViewStyle } from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";

export function Icon({
  name,
  size = 24,
  color,
  className,
  weight = "regular",
  style,
  muted,
  animationSpec,
}: {
  name: SymbolViewProps["name"];
  size?: number;
  color?: string;
  className?: string;
  muted?: boolean;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
  animationSpec?: AnimationSpec;
}) {
  const { isDark } = useColorScheme();
  let finalColor = color;
  if (!color) {
    finalColor = isDark ? "white" : "black";
  }

  return (
    <SymbolView
      weight={weight}
      tintColor={finalColor}
      resizeMode="scaleAspectFit"
      animationSpec={animationSpec}
      name={name}
      className={className}
      style={[
        {
          width: size,
          height: size,
        },
        style,
        muted ? { opacity: 0.5 } : {},
      ]}
    />
  );
}
