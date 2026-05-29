import { isToday } from "date-fns/isToday";
import { Link } from "expo-router";
import { memo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { TouchableOpacity, View } from "react-native";

import { Skeleton, ThemedText } from "@/components/ui/atoms";
import { AvatarGroup } from "@/components/ui/molecules/avatar-group";
import { PlanCoverBackground } from "@/components/ui/molecules/plan-cover-background";
import { usePlanChatUnread } from "@/domains/plan/plan-chat.api";
import { getFullName } from "@/domains/user/user.utils";
import { formatDayDistance, parseLocalDateString } from "@/lib/dates";

import type { PlanType } from "@/domains/plan/plan.api";

// memo() pays off because we feed this row from a paginated cache that
// preserves item identity across renders (`useInfiniteQuery` + `.flatMap`).
// With a stable identity FlatList's renderItem now reuses the same React
// fibers when the parent re-renders, fixing the "large list slow to
// update" warning on long plan feeds.
type PlanItemListProps = {
  id: string;
  title: string;
  /** Custom plan cover image. Takes precedence over the mountain collage. */
  imageUrl?: string | null;
  startDate?: string | null;
  status: "open" | "completed" | "canceled";
  type?: PlanType | null;
  isPrivate?: boolean;
  /** Admin-curated. Shown as a golden badge next to the status pill. */
  featured?: boolean;
  mountains?: {
    imageUrl?: string | null;
  }[];
  users: {
    id: string;
    firstName: string | null;
    lastName?: string | null;
    imageUrl?: string | null;
  }[];
};

const PlanItemListBase = ({
  id,
  title,
  imageUrl,
  startDate,
  status,
  type,
  isPrivate,
  featured,
  mountains,
  users,
}: PlanItemListProps) => {
  const { data } = usePlanChatUnread();
  const hasUnreadMessages = data?.includes(id);

  const intl = useIntl();
  const mountainsWithImages = mountains?.filter(({ imageUrl }) => imageUrl);

  const typeLabels: Record<PlanType, string> = {
    hike: intl.formatMessage({ defaultMessage: "Hike" }),
    trail: intl.formatMessage({ defaultMessage: "Trail" }),
    bike: intl.formatMessage({ defaultMessage: "Bike" }),
  };
  const typeLabel = type ? typeLabels[type] : null;

  const whenDate = startDate
    ? formatDayDistance(parseLocalDateString(startDate))
    : intl.formatMessage({ defaultMessage: "Still deciding a date" });
  const when = typeLabel ? `${typeLabel}, ${whenDate}` : whenDate;

  const isOpen = status === "open";
  const isOngoing =
    isOpen && !!startDate && isToday(parseLocalDateString(startDate));
  const isCompleted = status === "completed";
  const isCanceled = status === "canceled";

  return (
    <Link
      href={{
        pathname: "/plan/[id]",
        params: { id },
      }}
      asChild
    >
      <TouchableOpacity className="relative flex-row gap-4">
        <View className="absolute bottom-2 left-2">
          <AvatarGroup
            size="xs"
            avatarClassName="border-background/50"
            items={users.map((user) => ({
              name: getFullName(user),
              imageUrl: user.imageUrl,
            }))}
          />
        </View>
        <View className="relative">
          <View
            className="overflow-hidden rounded"
            style={{ width: 100, height: 100 }}
          >
            <PlanCoverBackground
              customImageUrl={imageUrl}
              mountains={mountainsWithImages}
              title={title}
            />
          </View>
          {hasUnreadMessages && (
            <View className="absolute -right-1 -top-1 size-4 rounded-full bg-primary" />
          )}
        </View>
        <View className="flex-1 justify-center">
          <View className="items-start gap-1">
            <View className="flex-row gap-2">
              {isOpen && !isOngoing && (
                <ThemedText className="font-semibold text-blue-500">
                  <FormattedMessage defaultMessage="Open" />
                </ThemedText>
              )}
              {isOpen && isOngoing && (
                <ThemedText className="font-semibold text-purple-500">
                  <FormattedMessage defaultMessage="Ongoing" />
                </ThemedText>
              )}
              {isCompleted && (
                <ThemedText className="font-semibold text-emerald-500">
                  <FormattedMessage defaultMessage="Completed" />
                </ThemedText>
              )}
              {isCanceled && (
                <ThemedText className="font-semibold text-neutral-500">
                  <FormattedMessage defaultMessage="Canceled" />
                </ThemedText>
              )}
              {featured && (
                <View className="self-center rounded-full bg-amber-400/15 px-2 py-0.5">
                  <ThemedText className="text-xs font-semibold uppercase tracking-wide text-amber-500">
                    <FormattedMessage defaultMessage="Featured" />
                  </ThemedText>
                </View>
              )}
            </View>
            <ThemedText
              numberOfLines={2}
              className="text-lg font-semibold tracking-tight"
            >
              {title}
            </ThemedText>
            {!isCanceled && (
              <ThemedText className="font-medium text-muted-foreground">
                {when}
                {isPrivate && (
                  <>
                    ,{" "}
                    <ThemedText className="font-medium text-primary">
                      <FormattedMessage defaultMessage="private" />
                    </ThemedText>
                  </>
                )}
              </ThemedText>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  );
};

export const PlanItemList = memo(PlanItemListBase);

export const PlanItemListSkeleton = () => (
  <View className="flex flex-row items-center gap-4">
    <Skeleton className="size-[100px] rounded" />
    <View className="gap-1">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-6 w-60" />
      <Skeleton className="h-4 w-32" />
    </View>
  </View>
);
