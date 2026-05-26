import { Mountain, Pencil, Trash2, Users } from "lucide-react-native";
import { ReactNode } from "react";
import { FormattedMessage } from "react-intl";
import { Image, TouchableOpacity, View } from "react-native";
import { twMerge } from "tailwind-merge";

import { ThemedText } from "@/components/ui/atoms";
import { LucideIcon } from "@/components/ui/atoms/lucide-icon";
import { pastelColors } from "@/constants/colors";
import { challengeCompletionPercent } from "@/domains/challenge/challenge.model";

type ChallengeListItemProps = {
  name: string;
  emoji?: string | null;
  peakImageUrl?: string | null;
  totalMountains: string;
  totalUsers?: string;
  /** Mountains in this challenge the viewer has summited. Drives the % badge
   *  that replaces the legacy "Active" pill when shown on the active card. */
  summitedCount?: number;
  index: number;
  isSelected?: boolean;
  onPress: () => void;
  onEditPress?: () => void;
  onDeletePress?: () => void;
  rightElement?: ReactNode;
};

export function ChallengeListItem({
  name,
  emoji,
  peakImageUrl,
  totalMountains,
  totalUsers,
  summitedCount,
  index,
  isSelected,
  onPress,
  onEditPress,
  onDeletePress,
  rightElement,
}: ChallengeListItemProps) {
  const usersCount = totalUsers ? Number(totalUsers) : 0;
  // Keep `summitedCount != null` as a separate guard: missing progress means
  // "no badge", whereas progress of 0 still renders a 0% badge.
  const completionPercent =
    summitedCount != null
      ? challengeCompletionPercent(summitedCount, Number(totalMountains))
      : null;
  return (
    <View className="gap-2">
      <TouchableOpacity
        onPress={onPress}
        className={twMerge(
          "overflow-hidden rounded border-2 border-border",
          isSelected && "border-primary",
        )}
      >
        {peakImageUrl ? (
          <Image
            source={{ uri: peakImageUrl, cache: "force-cache" }}
            className="h-40 w-full bg-neutral-200 dark:bg-neutral-800"
            resizeMode="cover"
          />
        ) : (
          <View
            className="h-40 w-full items-center justify-center"
            style={{
              backgroundColor:
                pastelColors[index % pastelColors.length]?.bg || "#BAE1FF",
            }}
          >
            <ThemedText className="text-5xl">{emoji || "🏔️"}</ThemedText>
          </View>
        )}
        <View
          className={twMerge(
            "flex-row items-center justify-between gap-2 p-3",
            isSelected && "bg-primary/10",
          )}
        >
          <View className="flex-1 gap-1">
            <ThemedText
              className={`text-2xl font-semibold tracking-tight ${isSelected ? "text-primary" : ""}`}
              numberOfLines={1}
            >
              {name}
            </ThemedText>
            <View className="flex-row items-center gap-3">
              <View className="flex-row items-center gap-1.5">
                <LucideIcon icon={Mountain} size={16} muted />
                <ThemedText className="font-medium text-muted-foreground">
                  {totalMountains}
                </ThemedText>
              </View>
              {usersCount > 0 && (
                <View className="flex-row items-center gap-1.5">
                  <LucideIcon icon={Users} size={16} muted />
                  <ThemedText className="font-medium text-muted-foreground">
                    {totalUsers}
                  </ThemedText>
                </View>
              )}
              {completionPercent != null && (
                <View className="ml-auto rounded-full border border-primary/40 px-2 py-0.5">
                  <ThemedText className="text-xs font-semibold text-primary">
                    {completionPercent}%
                  </ThemedText>
                </View>
              )}
            </View>
          </View>
          {rightElement}
        </View>
      </TouchableOpacity>
      {(onEditPress || onDeletePress) && (
        <View className="mt-2 flex-row items-center gap-6">
          {onEditPress && (
            <TouchableOpacity
              onPress={onEditPress}
              className="flex-row items-center gap-2"
            >
              <View className="size-8 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                <LucideIcon icon={Pencil} size={16} muted />
              </View>
              <ThemedText className="text-muted-foreground">
                <FormattedMessage defaultMessage="Edit" />
              </ThemedText>
            </TouchableOpacity>
          )}
          {onDeletePress && (
            <TouchableOpacity
              onPress={onDeletePress}
              className="flex-row items-center gap-2"
            >
              <View className="size-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-950">
                <LucideIcon icon={Trash2} size={16} color="#ef4444" />
              </View>
              <ThemedText className="text-red-500">
                <FormattedMessage defaultMessage="Delete" />
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}
