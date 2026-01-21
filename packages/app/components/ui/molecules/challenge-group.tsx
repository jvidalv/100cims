import { TouchableOpacity, View, Text } from "react-native";

import { pastelColors } from "@/constants/colors";
import { countryToEmoji } from "@/domains/challenge/challenge.model";

// Darker versions of pastel colors for text
const textColors: Record<string, string> = {
  "#BAE1FF": "#1a5f8a",
  "#FFFFBA": "#6b6b00",
  "#BAFFC9": "#1a6b2d",
  "#FFDFBA": "#8a5a1a",
  "#E2C2FF": "#5a2d8a",
  "#98CDF8": "#1a4a6b",
  "#D5ABFF": "#4a1a8a",
  "#BAC8FF": "#1a2d8a",
  "#E3FFBA": "#3d6b1a",
  "#BABBFF": "#1a1a8a",
  "#FFBABA": "#8a1a1a",
  "#C2FFE8": "#1a6b5a",
  "#D1FFBA": "#2d6b1a",
  "#FFD9BA": "#8a4a1a",
  "#EEBAFF": "#6b1a8a",
  "#F9C0C0": "#8a2d2d",
  "#BFFCC6": "#1a6b2d",
  "#C0D6E4": "#2d4a5a",
  "#FFD1DC": "#8a2d4a",
  "#FFF5BA": "#6b5a00",
  "#C6E2FF": "#1a4a8a",
  "#D5E8D4": "#2d5a2d",
  "#FDE2E4": "#8a3d4a",
  "#F0E5DE": "#5a4a3d",
  "#E3F2FD": "#1a4a6b",
};

type ChallengeItem = {
  id: string;
  name: string;
  country: string;
  emoji: string | null;
  imageUrl: string | null;
  isOfficial: boolean;
};

type ChallengeGroupProps = {
  items: ChallengeItem[];
  onPress?: (item: ChallengeItem) => void;
};

export const ChallengeGroup = ({ items, onPress }: ChallengeGroupProps) => {
  return (
    <View className="flex-row flex-wrap gap-1.5">
      {items?.map((item, index) => {
        // Use custom emoji if available, otherwise use country flag
        const displayEmoji = item.emoji || countryToEmoji(item.country);
        const bgColor =
          pastelColors[index % pastelColors.length]?.bg || "#BAE1FF";
        const textColor = textColors[bgColor] || "#333333";

        return (
          <TouchableOpacity
            key={item.id}
            disabled={!onPress}
            onPress={() => onPress?.(item)}
          >
            <View
              className="flex-row items-center gap-1 rounded-full px-2 py-0.5"
              style={{ backgroundColor: bgColor }}
            >
              <Text className="text-sm">{displayEmoji}</Text>
              <Text className="text-sm font-semibold" style={{ color: textColor }}>
                {item.name}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};
