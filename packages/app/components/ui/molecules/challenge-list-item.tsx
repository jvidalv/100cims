import { ReactNode } from "react";
import { TouchableOpacity, View } from "react-native";

import { Icon, ThemedText } from "@/components/ui/atoms";
import { pastelColors } from "@/constants/colors";

type ChallengeListItemProps = {
  name: string;
  emoji?: string | null;
  totalMountains: string;
  index: number;
  isSelected?: boolean;
  onPress: () => void;
  rightElement?: ReactNode;
};

export function ChallengeListItem({
  name,
  emoji,
  totalMountains,
  index,
  isSelected,
  onPress,
  rightElement,
}: ChallengeListItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center gap-4 rounded-xl border-2 border-border p-2"
    >
      <View
        className="size-12 items-center justify-center rounded-lg"
        style={{
          backgroundColor:
            pastelColors[index % pastelColors.length]?.bg || "#BAE1FF",
        }}
      >
        <ThemedText>{emoji || "🏔️"}</ThemedText>
      </View>
      <View className="flex-1">
        <ThemedText
          className={`text-xl font-black tracking-tighter ${isSelected ? "text-primary" : ""}`}
        >
          {name}
        </ThemedText>
        <View className="flex-row items-center gap-1">
          <Icon name="mountain.2.fill" muted size={18} />
          <ThemedText className="font-medium text-muted-foreground">
            {totalMountains}
          </ThemedText>
        </View>
      </View>
      {rightElement}
    </TouchableOpacity>
  );
}
