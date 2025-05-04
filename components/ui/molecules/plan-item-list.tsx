import { isToday } from "date-fns/isToday";
import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import { FormattedMessage, useIntl } from "react-intl";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";

import { Skeleton, ThemedText } from "@/components/ui/atoms";
import { AvatarGroup } from "@/components/ui/molecules/avatar-group";
import { usePlanChatUnread } from "@/domains/plan/plan-chat.api";
import { getFullName } from "@/domains/user/user.utils";
import { formatDayDistance } from "@/lib/dates";

export const PlanItemList = ({
  id,
  title,
  startDate,
  status,
  mountains,
  users,
}: {
  id: string;
  title: string;
  startDate?: string | null;
  status: "open" | "completed" | "canceled";
  mountains?: {
    imageUrl?: string | null;
  }[];
  users: {
    id: string;
    firstName: string | null;
    lastName?: string | null;
    imageUrl?: string | null;
  }[];
}) => {
  const { data } = usePlanChatUnread();
  const hasUnreadMessages = data?.data?.message?.includes(id);

  const intl = useIntl();
  const mountainsWithImages = mountains?.filter(({ imageUrl }) => imageUrl);

  const when = startDate
    ? formatDayDistance(new Date(startDate))
    : intl.formatMessage({ defaultMessage: "Still deciding a date" });

  const isOpen = status === "open";
  const isOngoing = isOpen && startDate && isToday(new Date(startDate));
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
          {mountainsWithImages?.length ? (
            <View
              className="relative flex flex-row overflow-hidden"
              style={{ width: 100, height: 100, borderRadius: 6 }}
            >
              {mountainsWithImages.slice(0, 4).map(({ imageUrl }, i, arr) => {
                const count = arr.length;

                if (count === 1) {
                  return (
                    <Image
                      key={imageUrl}
                      source={{ uri: imageUrl!, cache: "force-cache" }}
                      className="absolute bg-neutral-300 dark:bg-neutral-800"
                      style={{ width: "100%", height: "100%" }}
                    />
                  );
                }

                if (count === 2) {
                  return (
                    <Image
                      key={imageUrl}
                      source={{ uri: imageUrl!, cache: "force-cache" }}
                      className=" bg-neutral-300 dark:bg-neutral-800"
                      style={{
                        width: "50%",
                        height: "100%",
                      }}
                    />
                  );
                }

                const hasOnlyThree = arr?.length === 3;
                const isLast = i === arr?.length - 1;
                const half = "50%";
                const positionStyle =
                  i === 0
                    ? { top: 0, left: 0 }
                    : i === 1
                      ? { top: 0, right: 0 }
                      : i === 2
                        ? { bottom: 0, left: 0 }
                        : { bottom: 0, right: 0 };

                return (
                  <Image
                    key={imageUrl}
                    source={{ uri: imageUrl!, cache: "force-cache" }}
                    className="absolute bg-neutral-300 dark:bg-neutral-800"
                    style={{
                      width: hasOnlyThree && isLast ? "100%" : half,
                      height: half,
                      ...positionStyle,
                    }}
                  />
                );
              })}
              <View className="absolute bottom-0 size-full">
                <LinearGradient
                  colors={[
                    "transparent",
                    "transparent",
                    "transparent",
                    "rgba(0,0,0,0.4)",
                  ]}
                  style={StyleSheet.absoluteFill}
                />
              </View>
            </View>
          ) : (
            <View
              className="items-center justify-center bg-neutral-300 dark:bg-neutral-800"
              style={{
                width: 100,
                height: 100,
                borderRadius: 6,
                backgroundColor: "#ffd097",
              }}
            >
              <ThemedText className="text-4xl text-background">
                {title.slice(0, 2).toUpperCase()}
              </ThemedText>
            </View>
          )}
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
              </ThemedText>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  );
};

export const PlanItemListSkeleton = () => (
  <View className="flex flex-row items-center gap-4">
    <Skeleton className="size-[100px] rounded-lg" />
    <View className="gap-1">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-6 w-60" />
      <Skeleton className="h-4 w-32" />
    </View>
  </View>
);
