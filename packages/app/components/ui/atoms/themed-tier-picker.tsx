import { useColorScheme } from "nativewind";
import { Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { twMerge } from "tailwind-merge";

import { ThemedText } from "@/components/ui/atoms/themed-text";

type ColorCodedMode = "red-green" | "green-red";

type Props = {
  value: number | null;
  onChange: (value: number | null) => void;
  labels?: readonly string[];
  values?: readonly number[];
  count?: number;
  /**
   * Render a small colored dot on the left of each pill, interpolated across
   * positions. `"red-green"`: first chip red → last chip green (e.g. safety,
   * where the last tier is the "good" one). `"green-red"`: reversed (e.g.
   * difficulty, where the last tier is the "bad" one). Decorative; labels
   * still carry semantics.
   */
  colorCoded?: ColorCodedMode;
};

const RED = { r: 239, g: 68, b: 68 };
const ORANGE = { r: 245, g: 158, b: 11 };
const GREEN = { r: 34, g: 197, b: 94 };
const TRANSITION_MS = 180;

// Reanimated can't interpolate hex strings, so we keep the rgb/rgba forms
// here. Selected border tracks the theme's foreground color (black in light,
// white in dark) to match the rest of the app's selected-emphasis treatment.
const UNSELECTED_BORDER = "rgba(115, 115, 115, 0.4)";
const SELECTED_BG = "rgba(115, 115, 115, 0.12)";
const TRANSPARENT = "rgba(0, 0, 0, 0)";
const FOREGROUND_LIGHT = "rgb(0, 0, 0)";
const FOREGROUND_DARK = "rgb(255, 255, 255)";

type Rgb = { r: number; g: number; b: number };

const lerpRgb = (a: Rgb, b: Rgb, t: number): Rgb => ({
  r: Math.round(a.r + (b.r - a.r) * t),
  g: Math.round(a.g + (b.g - a.g) * t),
  b: Math.round(a.b + (b.b - a.b) * t),
});

/**
 * Interpolate across the red → orange → green gradient at `count` positions.
 * Three anchors (not two) so the middle tier of a 3-chip picker lands on
 * orange instead of muddy olive. Pass `reverse` for axes where the last tier
 * is the "bad" one (difficulty).
 */
export const tierColor = (
  position: number,
  count: number,
  reverse = false,
): string => {
  if (count <= 1) return `rgb(${GREEN.r},${GREEN.g},${GREEN.b})`;
  const t = position / (count - 1);
  const eff = reverse ? 1 - t : t;
  const color =
    eff < 0.5
      ? lerpRgb(RED, ORANGE, eff * 2)
      : lerpRgb(ORANGE, GREEN, (eff - 0.5) * 2);
  return `rgb(${color.r},${color.g},${color.b})`;
};

type PillProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  dotColor?: string;
};

const Pill = ({ label, selected, onPress, dotColor }: PillProps) => {
  const { colorScheme } = useColorScheme();
  const selectedBorder =
    colorScheme === "dark" ? FOREGROUND_DARK : FOREGROUND_LIGHT;

  const animatedStyle = useAnimatedStyle(() => ({
    borderColor: withTiming(selected ? selectedBorder : UNSELECTED_BORDER, {
      duration: TRANSITION_MS,
    }),
    backgroundColor: withTiming(selected ? SELECTED_BG : TRANSPARENT, {
      duration: TRANSITION_MS,
    }),
  }));

  return (
    <Pressable onPress={onPress} hitSlop={4}>
      <Animated.View
        style={animatedStyle}
        className="h-12 flex-row items-center justify-center rounded-full border-2 px-4"
      >
        {dotColor && (
          <View
            className="mr-2 size-3 rounded-full"
            style={{ backgroundColor: dotColor }}
          />
        )}
        <ThemedText
          className={twMerge(
            "text-sm font-semibold",
            selected && "text-foreground",
          )}
        >
          {label}
        </ThemedText>
      </Animated.View>
    </Pressable>
  );
};

export const ThemedTierPicker = ({
  value,
  onChange,
  labels,
  values,
  count = values?.length ?? labels?.length ?? 5,
  colorCoded,
}: Props) => {
  const reverse = colorCoded === "green-red";
  return (
    <View className="flex-row flex-wrap items-center gap-1.5">
      {Array.from({ length: count }, (_, i) => {
        const stored = values?.[i] ?? i + 1;
        const selected = value === stored;
        const label = labels?.[i] ?? String(stored);
        return (
          <Pill
            key={stored}
            label={label}
            selected={selected}
            onPress={() => onChange(selected ? null : stored)}
            dotColor={
              colorCoded ? tierColor(i, count, reverse) : undefined
            }
          />
        );
      })}
    </View>
  );
};
