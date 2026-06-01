import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import { setStatusBarStyle } from "expo-status-bar";
import { ArrowRight, Info, Mountain } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  Alert,
  FlatList,
  TouchableOpacity,
  useColorScheme,
  View,
  ViewToken,
} from "react-native";
import { twMerge } from "tailwind-merge";

import {
  HISCORE_ROW_HEIGHT,
  HiscoreRow,
  HiscoreRowSkeleton,
} from "@/components/hiscores/hiscore-row";
import {
  ActivityIndicator,
  Avatar,
  LucideIcon,
  Skeleton,
  ThemedText,
  ThemedView,
} from "@/components/ui/atoms";
import {
  BlurredScreenHeader,
  useBlurredScreenHeaderHeight,
} from "@/components/ui/molecules";
import { Colors } from "@/constants/colors";
import { useActiveChallenge } from "@/domains/challenge/challenge.api";
import { useHiscoresGet } from "@/domains/hiscores/hiscores.api";
import { useScoreFormatter } from "@/domains/hiscores/use-score-formatter";
import { useUserMe } from "@/domains/user/user.api";
import { getFullName } from "@/domains/user/user.utils";
import { isIOS } from "@/lib/device";
import { getInitials } from "@/lib/strings";

type HiscoreItem = {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  uniquePeaksCount: string;
  totalScore: number;
};

const MEDAL_RING_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"] as const;

export default function HiscoresScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const blurredHeaderHeight = useBlurredScreenHeaderHeight();
  const { data: user } = useUserMe();
  const {
    data: hiscoresData,
    isPending: isPendingHiscores,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useHiscoresGet();
  const { data: challenge } = useActiveChallenge();

  // Other screens (mountain, challenge details) force `light` for their dark
  // hero images. Restore the default here on mount so navigating into this
  // page doesn't inherit their override.
  useEffect(() => {
    if (!isIOS) return;
    setStatusBarStyle(colorScheme === "dark" ? "light" : "dark", true);
  }, [colorScheme]);

  const hiscores = useMemo(
    () => hiscoresData?.pages?.flatMap((p) => p?.items ?? []) ?? [],
    [hiscoresData],
  );
  const podium = useMemo(() => hiscores.slice(0, 3), [hiscores]);
  const restOfList = useMemo(() => hiscores.slice(3), [hiscores]);

  const myHiscoreIndex = useMemo(
    () => (user ? hiscores.findIndex((h) => h.userId === user.id) : -1),
    [hiscores, user],
  );

  const myRank = hiscoresData?.pages?.[0]?.pagination.myRank;

  const intl = useIntl();
  const showPointsExplanation = () => {
    Alert.alert(
      intl.formatMessage({ defaultMessage: "How points work" }),
      intl.formatMessage({
        defaultMessage:
          "One summit of 1000 meters equals 100 points. Essentials are worth x2 — summit them!",
      }),
    );
  };

  const isVisibleOnHiscores = user?.visibleOnHiscores;

  const listRef = useRef<FlatList<HiscoreItem>>(null);
  const [viewableRange, setViewableRange] = useState<{
    first: number;
    last: number;
  } | null>(null);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      let first: number | null = null;
      let last: number | null = null;
      for (const v of viewableItems) {
        if (typeof v.index !== "number") continue;
        if (first === null || v.index < first) first = v.index;
        if (last === null || v.index > last) last = v.index;
      }
      setViewableRange((prev) => {
        if (first === null || last === null) return prev === null ? prev : null;
        if (prev && prev.first === first && prev.last === last) return prev;
        return { first, last };
      });
    },
  ).current;

  const myListIndex = myHiscoreIndex - 3;
  const isMyRowLoaded = myHiscoreIndex >= 0;

  const isMyRowInViewport =
    isMyRowLoaded &&
    viewableRange !== null &&
    myListIndex >= viewableRange.first &&
    myListIndex <= viewableRange.last;

  const jumpToMyRow = useCallback(() => {
    if (!user) return;
    if (myHiscoreIndex >= 0 && myHiscoreIndex < 3) {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
      return;
    }
    if (myListIndex >= 0) {
      listRef.current?.scrollToIndex({
        index: myListIndex,
        animated: true,
        viewPosition: 0.3,
      });
      return;
    }
    router.push("/hiscores/me");
  }, [myHiscoreIndex, myListIndex, router, user]);

  const showFab =
    !!user &&
    !!isVisibleOnHiscores &&
    myRank !== null &&
    !isMyRowInViewport;

  const formatScore = useScoreFormatter();

  return (
    <ThemedView className="flex-1">
      <BlurredScreenHeader
        rightElement={
          <TouchableOpacity onPress={showPointsExplanation} hitSlop={16}>
            <LucideIcon icon={Info} size={22} />
          </TouchableOpacity>
        }
      >
        <ThemedText numberOfLines={1} className="text-lg font-medium">
          <FormattedMessage defaultMessage="Hiscores" />
        </ThemedText>
      </BlurredScreenHeader>
      <FlatList
        ref={listRef}
        data={restOfList}
        initialNumToRender={25}
        contentContainerStyle={{ paddingTop: blurredHeaderHeight }}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        getItemLayout={(_, index) => ({
          length: HISCORE_ROW_HEIGHT,
          offset: HISCORE_ROW_HEIGHT * index,
          index,
        })}
        onScrollToIndexFailed={({ index, averageItemLength }) => {
          listRef.current?.scrollToOffset({
            offset: index * (averageItemLength || HISCORE_ROW_HEIGHT),
            animated: true,
          });
          setTimeout(() => {
            listRef.current?.scrollToIndex({
              index,
              animated: true,
              viewPosition: 0.3,
            });
          }, 100);
        }}
        ListHeaderComponent={
          <ThemedView className="pb-4">
            {user && !isVisibleOnHiscores && (
              <Link href="/user/me" asChild>
                <TouchableOpacity className="mx-4 mt-4 flex-row items-center justify-between rounded border-2 border-primary p-4">
                  <ThemedText className="font-medium text-primary">
                    <FormattedMessage defaultMessage="I want to be visible on the hiscores" />
                  </ThemedText>
                  <LucideIcon
                    icon={ArrowRight}
                    size={16}
                    color={Colors.dark.primary}
                  />
                </TouchableOpacity>
              </Link>
            )}
            {isPendingHiscores && <HiscoresSkeleton />}
            {!isPendingHiscores && !hiscores.length && (
              <ThemedText className="mt-4 px-6 text-muted-foreground">
                <FormattedMessage defaultMessage="No one has yet reached the hiscores." />
              </ThemedText>
            )}
            {podium.length > 0 && (
              <View className="mx-4">
                <Podium
                  entries={podium}
                  totalMountains={challenge?.totalMountains}
                  currentUserId={user?.id}
                  formatScore={formatScore}
                  onPressUser={(userId) => router.push(`/user/${userId}`)}
                />
              </View>
            )}
          </ThemedView>
        }
        ListFooterComponent={
          <>
            {isFetchingNextPage && (
              <View className="py-4">
                <ActivityIndicator />
              </View>
            )}
            <View className="h-32" />
          </>
        }
        keyExtractor={({ userId }) => userId}
        renderItem={({ index, item }) => (
          <HiscoreRow
            entry={item}
            rank={index + 4}
            totalMountains={challenge?.totalMountains ?? null}
            isMe={item.userId === user?.id}
            formatScore={formatScore}
          />
        )}
      />
      {showFab && user && (
        <TouchableOpacity
          onPress={jumpToMyRow}
          className="absolute bottom-8 right-6 z-10 size-16 items-center justify-center overflow-hidden rounded-full"
        >
          <Avatar
            size="md"
            className="size-16"
            initials={getInitials(
              getFullName({
                firstName: user.firstName,
                lastName: user.lastName,
              }),
            )}
            imageUrl={user.imageUrl}
          />
          <LinearGradient
            colors={["rgba(0,0,0,0.1)", "rgba(0,0,0,0.75)"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
          <View className="absolute inset-0 items-center justify-center">
            {typeof myRank === "number" ? (
              <ThemedText
                className="text-white font-semibold"
                style={{ fontSize: myRank >= 1000 ? 14 : 18 }}
              >
                {myRank}
              </ThemedText>
            ) : (
              <ActivityIndicator size="sm" color="#a3a3a3" />
            )}
          </View>
        </TouchableOpacity>
      )}
    </ThemedView>
  );
}

function Podium({
  entries,
  totalMountains,
  currentUserId,
  formatScore,
  onPressUser,
}: {
  entries: HiscoreItem[];
  totalMountains: string | undefined;
  currentUserId: string | undefined;
  formatScore: (score: number) => string;
  onPressUser: (userId: string) => void;
}) {
  const [first, second, third] = entries;
  return (
    <View className="mt-2 overflow-hidden rounded-xl bg-neutral-900 dark:border dark:border-border">
      {first && (
        <PodiumHeroRow
          entry={first}
          totalMountains={totalMountains}
          isMe={first.userId === currentUserId}
          formatScore={formatScore}
          onPress={() => onPressUser(first.userId)}
        />
      )}
      {second && (
        <PodiumCompactRow
          entry={second}
          rankIndex={1}
          totalMountains={totalMountains}
          isMe={second.userId === currentUserId}
          formatScore={formatScore}
          onPress={() => onPressUser(second.userId)}
        />
      )}
      {third && (
        <PodiumCompactRow
          entry={third}
          rankIndex={2}
          totalMountains={totalMountains}
          isMe={third.userId === currentUserId}
          formatScore={formatScore}
          onPress={() => onPressUser(third.userId)}
        />
      )}
    </View>
  );
}

function PodiumHeroRow({
  entry,
  totalMountains,
  isMe,
  formatScore,
  onPress,
}: {
  entry: HiscoreItem;
  totalMountains: string | undefined;
  isMe: boolean;
  formatScore: (score: number) => string;
  onPress: () => void;
}) {
  const fullName = getFullName({
    firstName: entry.firstName,
    lastName: entry.lastName,
  });
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center gap-4 p-4"
    >
      <Avatar
        size="xl"
        initials={getInitials(fullName)}
        imageUrl={entry.imageUrl}
        style={{ borderWidth: 3, borderColor: MEDAL_RING_COLORS[0] }}
      />
      <View className="flex-1">
        <ThemedText
          className={twMerge(
            "text-lg font-bold text-white",
            isMe && "text-primary",
          )}
          numberOfLines={1}
        >
          {fullName}
        </ThemedText>
        <ThemedText className="text-2xl font-bold text-primary">
          {formatScore(entry.totalScore)}
        </ThemedText>
        <View className="mt-0.5 flex-row items-center gap-1">
          <LucideIcon icon={Mountain} color="#a3a3a3" size={14} />
          <ThemedText className="text-sm text-neutral-400">
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
    </TouchableOpacity>
  );
}

function PodiumCompactRow({
  entry,
  rankIndex,
  totalMountains,
  isMe,
  formatScore,
  onPress,
}: {
  entry: HiscoreItem;
  rankIndex: 1 | 2;
  totalMountains: string | undefined;
  isMe: boolean;
  formatScore: (score: number) => string;
  onPress: () => void;
}) {
  const fullName = getFullName({
    firstName: entry.firstName,
    lastName: entry.lastName,
  });
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center gap-3 border-t border-white/10 p-3"
    >
      <Avatar
        size="md"
        initials={getInitials(fullName)}
        imageUrl={entry.imageUrl}
        style={{ borderWidth: 2, borderColor: MEDAL_RING_COLORS[rankIndex] }}
      />
      <View className="flex-1">
        <ThemedText
          className={twMerge(
            "font-semibold text-white",
            isMe && "text-primary",
          )}
          numberOfLines={1}
        >
          {fullName}
        </ThemedText>
        <View className="mt-0.5 flex-row items-center gap-1">
          <LucideIcon icon={Mountain} color="#a3a3a3" size={14} />
          <ThemedText className="text-sm text-neutral-400">
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
}

function HiscoresSkeleton() {
  return (
    <View className="mt-2 gap-2">
      <View className="overflow-hidden rounded-xl bg-neutral-900">
        <View className="flex-row items-center gap-4 p-4">
          <Skeleton className="size-20 rounded-full bg-neutral-700" />
          <View className="flex-1 gap-2">
            <Skeleton className="h-5 w-40 bg-neutral-700" />
            <Skeleton className="h-7 w-24 bg-neutral-700" />
            <Skeleton className="h-4 w-24 bg-neutral-700" />
          </View>
        </View>
        <View className="flex-row items-center gap-3 border-t border-white/10 p-3">
          <Skeleton className="size-12 rounded-full bg-neutral-700" />
          <View className="flex-1 gap-2">
            <Skeleton className="h-5 w-32 bg-neutral-700" />
            <Skeleton className="h-4 w-20 bg-neutral-700" />
          </View>
          <Skeleton className="h-5 w-14 bg-neutral-700" />
        </View>
        <View className="flex-row items-center gap-3 border-t border-white/10 p-3">
          <Skeleton className="size-12 rounded-full bg-neutral-700" />
          <View className="flex-1 gap-2">
            <Skeleton className="h-5 w-28 bg-neutral-700" />
            <Skeleton className="h-4 w-20 bg-neutral-700" />
          </View>
          <Skeleton className="h-5 w-14 bg-neutral-700" />
        </View>
      </View>
      <HiscoreRowSkeleton />
      <HiscoreRowSkeleton />
      <HiscoreRowSkeleton />
    </View>
  );
}
