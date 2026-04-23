import { useRouter } from "expo-router";
import { Mountain } from "lucide-react-native";
import { memo } from "react";
import { FormattedMessage } from "react-intl";
import { TouchableOpacity, View } from "react-native";
import { twMerge } from "tailwind-merge";

import {
  Avatar,
  LucideIcon,
  Skeleton,
  ThemedText,
} from "@/components/ui/atoms";
import { HiscoreEntry } from "@/domains/hiscores/hiscores.api";
import { getFullName } from "@/domains/user/user.utils";
import { getInitials } from "@/lib/strings";

export const HISCORE_ROW_HEIGHT = 76;

interface HiscoreRowProps {
  entry: Pick<
    HiscoreEntry,
    | "userId"
    | "firstName"
    | "lastName"
    | "imageUrl"
    | "uniquePeaksCount"
    | "totalScore"
  >;
  rank: number;
  totalMountains: number | string | null;
  isMe: boolean;
  formatScore: (score: number) => string;
}

export const HiscoreRow = memo(function HiscoreRow({
  entry,
  rank,
  totalMountains,
  isMe,
  formatScore,
}: HiscoreRowProps) {
  const router = useRouter();
  const fullName = getFullName({
    firstName: entry.firstName,
    lastName: entry.lastName,
  });
  return (
    <TouchableOpacity
      onPress={() => router.push(`/user/${entry.userId}`)}
      className={twMerge(
        "mx-4 mb-2 flex-row items-center gap-3 rounded-lg border border-border p-3",
        isMe && "border-primary bg-primary/10",
      )}
    >
      <Avatar
        size="md"
        initials={getInitials(fullName)}
        imageUrl={entry.imageUrl}
      />
      <View className="flex-1">
        <ThemedText
          className={twMerge("font-semibold", isMe && "text-primary")}
          numberOfLines={1}
        >
          <ThemedText className="font-semibold text-muted-foreground">
            {rank}.{" "}
          </ThemedText>
          {fullName}
        </ThemedText>
        <View className="mt-0.5 flex-row items-center gap-1">
          <LucideIcon icon={Mountain} muted size={14} />
          <ThemedText className="text-sm text-muted-foreground">
            <FormattedMessage
              defaultMessage="{count} of {total}"
              values={{
                count: entry.uniquePeaksCount,
                total: totalMountains ?? "—",
              }}
            />
          </ThemedText>
        </View>
      </View>
      <ThemedText className="text-lg font-bold text-primary">
        {formatScore(entry.totalScore)}
      </ThemedText>
    </TouchableOpacity>
  );
});

export function HiscoreRowSkeleton() {
  return (
    <View className="flex-row items-center gap-3 rounded-lg border border-border p-3">
      <Skeleton className="size-12 rounded-full" />
      <View className="flex-1 gap-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-20" />
      </View>
      <Skeleton className="h-5 w-14" />
    </View>
  );
}
