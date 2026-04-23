import {
  Baby,
  Dog,
  Info,
  TriangleAlert,
  type LucideIcon as LucideIconType,
} from "lucide-react-native";
import { FormattedMessage, useIntl } from "react-intl";
import { Alert, Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

import {
  LucideIcon,
  ThemedText,
  ThemedTierPicker,
  tierColor,
} from "@/components/ui/atoms";

const SAFETY_VALUES = [1, 5];
const DIFFICULTY_VALUES = [1, 3, 5];
const FADE_MS = 180;

type Props = {
  familyFriendly: number | null;
  onFamilyFriendlyChange: (v: number | null) => void;
  dogFriendly: number | null;
  onDogFriendlyChange: (v: number | null) => void;
  difficulty: number | null;
  onDifficultyChange: (v: number | null) => void;
};

/**
 * Shared Recommend + Difficulty rating section for the summit create + edit
 * forms. Ratings are per-user-per-mountain (see mountainRatingTable) so both
 * flows read and write the same row; the server upserts on conflict.
 */
export const SummitRatingFields = ({
  familyFriendly,
  onFamilyFriendlyChange,
  dogFriendly,
  onDogFriendlyChange,
  difficulty,
  onDifficultyChange,
}: Props) => {
  const intl = useIntl();

  const safetyLabels = [
    intl.formatMessage({ defaultMessage: "Unsafe" }),
    intl.formatMessage({ defaultMessage: "Safe" }),
  ];
  const difficultyLabels = [
    intl.formatMessage({ defaultMessage: "Easy" }),
    intl.formatMessage({ defaultMessage: "Moderate" }),
    intl.formatMessage({ defaultMessage: "Hard" }),
  ];

  return (
    <>
      <View className="gap-3">
        <ThemedText className="text-lg font-bold">
          <FormattedMessage defaultMessage="Difficulty" />
        </ThemedText>
        <RatingRow
          icon={TriangleAlert}
          value={difficulty}
          onChange={onDifficultyChange}
          labels={difficultyLabels}
          values={DIFFICULTY_VALUES}
          colorMode="green-red"
        />
      </View>
      <View className="gap-3">
        <View className="flex-row items-center gap-2">
          <ThemedText className="text-lg font-bold">
            <FormattedMessage defaultMessage="Recommend" />
          </ThemedText>
          <Pressable
            hitSlop={8}
            onPress={() =>
              Alert.alert(
                intl.formatMessage({ defaultMessage: "How to rate" }),
                intl.formatMessage({
                  defaultMessage:
                    "Tap Safe if you'd bring a child or dog on the safest route up this mountain, Unsafe if you wouldn't. Skip either row if you're not sure.",
                }),
              )
            }
          >
            <LucideIcon icon={Info} size={16} muted />
          </Pressable>
        </View>
        <RatingRow
          icon={Baby}
          value={familyFriendly}
          onChange={onFamilyFriendlyChange}
          labels={safetyLabels}
          values={SAFETY_VALUES}
          colorMode="red-green"
        />
        <RatingRow
          icon={Dog}
          value={dogFriendly}
          onChange={onDogFriendlyChange}
          labels={safetyLabels}
          values={SAFETY_VALUES}
          colorMode="red-green"
        />
      </View>
    </>
  );
};

type RatingRowProps = {
  icon: LucideIconType;
  value: number | null;
  onChange: (v: number | null) => void;
  labels: string[];
  values: readonly number[];
  colorMode: "red-green" | "green-red";
};

const RatingRow = ({
  icon,
  value,
  onChange,
  labels,
  values,
  colorMode,
}: RatingRowProps) => {
  const reverse = colorMode === "green-red";
  const activeColor =
    value !== null
      ? tierColor(values.indexOf(value), values.length, reverse)
      : null;

  return (
    <View className="flex-row items-center gap-3">
      <View className="size-12 items-center justify-center rounded-full border-2 border-muted-foreground/50">
        <FadeIcon icon={icon} color={activeColor} />
      </View>
      <ThemedTierPicker
        value={value}
        onChange={onChange}
        labels={labels}
        values={values}
        colorCoded={colorMode}
      />
    </View>
  );
};

function FadeIcon({
  icon,
  color,
  size = 24,
}: {
  icon: LucideIconType;
  color: string | null;
  size?: number;
}) {
  const coloredStyle = useAnimatedStyle(() => ({
    opacity: withTiming(color ? 1 : 0, { duration: FADE_MS }),
  }));
  const mutedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(color ? 0 : 1, { duration: FADE_MS }),
  }));

  return (
    <View>
      <Animated.View style={mutedStyle}>
        <LucideIcon icon={icon} size={size} />
      </Animated.View>
      <Animated.View style={[coloredStyle, { position: "absolute" }]}>
        <LucideIcon icon={icon} size={size} color={color ?? undefined} />
      </Animated.View>
    </View>
  );
}
