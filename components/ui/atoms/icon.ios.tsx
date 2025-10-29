import {
  SymbolView,
  SymbolViewProps,
  SymbolWeight,
  type AnimationSpec,
} from "expo-symbols";
import { useColorScheme } from "nativewind";
import { StyleProp, ViewStyle } from "react-native";

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
  const { colorScheme } = useColorScheme();
  let finalColor = color;
  if (!color) {
    finalColor = colorScheme === "dark" ? "white" : "black";
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
