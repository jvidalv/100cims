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
  onEditPress?: () => void;
  rightElement?: ReactNode;
};

export function ChallengeListItem({
  name,
  emoji,
  totalMountains,
  index,
  isSelected,
  onPress,
  onEditPress,
  rightElement,
}: ChallengeListItemProps) {
  return (
    <View className="flex-row items-center gap-2">
      <TouchableOpacity
        onPress={onPress}
        className="flex-1 flex-row items-center gap-4 rounded border-2 border-border p-2"
      >
        <View
          className="size-12 items-center justify-center rounded"
          style={{
            backgroundColor:
              pastelColors[index % pastelColors.length]?.bg || "#BAE1FF",
          }}
        >
          <ThemedText>{emoji || "🏔️"}</ThemedText>
        </View>
        <View className="flex-1">
          <ThemedText
            className={`text-xl font-extrabold tracking-tighter ${isSelected ? "text-primary" : ""}`}
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
      {onEditPress && (
        <TouchableOpacity
          onPress={onEditPress}
          className=" items-center justify-center rounded border-2 border-border px-3"
          style={{
            height: 60,
          }}
        >
          <Icon name="pencil" size={18} weight="black" />
        </TouchableOpacity>
      )}
    </View>
  );
}
