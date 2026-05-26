import { Globe, Lock, Mountain, Pencil, Trash2, Users } from "lucide-react-native";
import { ReactNode } from "react";
import { FormattedMessage } from "react-intl";
import { Image, TouchableOpacity, View } from "react-native";
import { twMerge } from "tailwind-merge";

import { LucideIcon, ThemedText } from "@/components/ui/atoms";
import { challengeCompletionPercent } from "@/domains/challenge/challenge.model";

interface ChallengeRowMinimalProps {
  name: string;
  emoji?: string | null;
  peakImageUrl?: string | null;
  totalMountains: string;
  totalUsers?: string;
  /** Mountains in this challenge the viewer has summited. Omit / pass 0 for
   *  challenges where the viewer has no progress. */
  summitedCount?: number;
  /** When set, renders a small Globe (public) / Lock (private) chip in the
   *  subtitle row after the users count. Used on /user/challenges where the
   *  visibility was previously a section heading. */
  isPublic?: boolean;
  isSelected?: boolean;
  distance?: number | null;
  onPress: () => void;
  onEditPress?: () => void;
  onDeletePress?: () => void;
  rightElement?: ReactNode;
}

/**
 * Compact one-line challenge row used in the /challenges list and on
 * /user/challenges. Mirrors `MountainRowMinimal` — 40×40 thumbnail, single
 * title line, subtitle with counts (and optional distance for the "Closer"
 * sort). When `onEditPress` / `onDeletePress` are provided, owner actions
 * render in a row below the touchable, same shape as `ChallengeListItem`.
 */
export function ChallengeRowMinimal({
  name,
  emoji,
  peakImageUrl,
  totalMountains,
  totalUsers,
  summitedCount,
  isPublic,
  isSelected,
  distance,
  onPress,
  onEditPress,
  onDeletePress,
  rightElement,
}: ChallengeRowMinimalProps) {
  const usersCount = totalUsers ? Number(totalUsers) : 0;
  const summited = summitedCount ?? 0;
  const completionPercent =
    challengeCompletionPercent(summited, Number(totalMountains)) ?? 0;
  // Tier the badge colouring so eye drifts straight to high-completion
  // challenges. 100% = primary fill, ≥1 = primary outline, 0 = muted.
  const badgeStyle =
    completionPercent >= 100
      ? "bg-primary"
      : summited > 0
        ? "border border-primary/40 bg-primary/10"
        : "border border-border bg-transparent";
  const badgeText =
    completionPercent >= 100
      ? "text-primary-foreground"
      : summited > 0
        ? "text-primary"
        : "text-muted-foreground";
  return (
    <View className="gap-2">
      <TouchableOpacity
        onPress={onPress}
        className="flex-row items-center gap-3"
      >
        {peakImageUrl ? (
          <Image
            source={{ uri: peakImageUrl, cache: "force-cache" }}
            className="size-10 rounded bg-gray-400 dark:bg-gray-500"
          />
        ) : (
          <View className="size-10 items-center justify-center rounded bg-gray-400 dark:bg-gray-500">
            <ThemedText className="text-lg">{emoji ?? "🏔️"}</ThemedText>
          </View>
        )}
        <View className="flex-1">
          <ThemedText
            className={twMerge(
              "font-medium",
              isSelected && "text-primary",
            )}
            numberOfLines={1}
          >
            {name}
          </ThemedText>
          <View className="flex-row items-center gap-3">
            <View className="flex-row items-center gap-1">
              <LucideIcon icon={Mountain} size={14} muted />
              <ThemedText className="text-sm text-muted-foreground">
                {totalMountains}
              </ThemedText>
            </View>
            {usersCount > 0 && (
              <View className="flex-row items-center gap-1">
                <LucideIcon icon={Users} size={14} muted />
                <ThemedText className="text-sm text-muted-foreground">
                  {totalUsers}
                </ThemedText>
              </View>
            )}
            {isPublic != null && (
              <View className="flex-row items-center gap-1">
                <LucideIcon
                  icon={isPublic ? Globe : Lock}
                  size={12}
                  muted
                />
                <ThemedText className="text-xs text-muted-foreground">
                  {isPublic ? (
                    <FormattedMessage defaultMessage="Public" />
                  ) : (
                    <FormattedMessage defaultMessage="Private" />
                  )}
                </ThemedText>
              </View>
            )}
            {distance != null && (
              <ThemedText className="text-sm text-muted-foreground">
                {distance} km
              </ThemedText>
            )}
          </View>
        </View>
        {rightElement ? (
          rightElement
        ) : (
          <View
            className={twMerge(
              "items-center justify-center rounded-full px-2 py-0.5",
              badgeStyle,
            )}
          >
            <ThemedText className={twMerge("text-xs font-semibold", badgeText)}>
              {completionPercent}%
            </ThemedText>
          </View>
        )}
      </TouchableOpacity>
      {(onEditPress || onDeletePress) && (
        <View className="flex-row items-center gap-6">
          {onEditPress && (
            <TouchableOpacity
              onPress={onEditPress}
              className="flex-row items-center gap-2"
            >
              <View className="size-8 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                <LucideIcon icon={Pencil} size={16} muted />
              </View>
              <ThemedText className="text-sm text-muted-foreground">
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
              <ThemedText className="text-sm text-red-500">
                <FormattedMessage defaultMessage="Delete" />
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}
