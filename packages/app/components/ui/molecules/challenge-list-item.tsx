import { ReactNode } from "react";
import { Image, TouchableOpacity, View } from "react-native";

import { Icon, ThemedText } from "@/components/ui/atoms";
import { pastelColors } from "@/constants/colors";

type ChallengeListItemProps = {
  name: string;
  emoji?: string | null;
  peakImageUrl?: string | null;
  index: number;
  isSelected?: boolean;
  onPress: () => void;
  onEditPress?: () => void;
  rightElement?: ReactNode;
};

export function ChallengeListItem({
  name,
  emoji,
  peakImageUrl,
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
        {peakImageUrl ? (
          <Image
            source={{ uri: peakImageUrl, cache: "force-cache" }}
            className="size-12 rounded bg-neutral-200 dark:bg-neutral-800"
          />
        ) : (
          <View
            className="size-12 items-center justify-center rounded"
            style={{
              backgroundColor:
                pastelColors[index % pastelColors.length]?.bg || "#BAE1FF",
            }}
          >
            <ThemedText>{emoji || "🏔️"}</ThemedText>
          </View>
        )}
        <View className="flex-1">
          <ThemedText
            className={`text-2xl font-semibold tracking-tight ${isSelected ? "text-primary" : ""}`}
          >
            {name}
          </ThemedText>
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
