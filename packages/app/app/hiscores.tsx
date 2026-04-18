import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Info,
  Mountain,
} from "lucide-react-native";
import { useCallback, useMemo, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  View,
  ViewToken,
} from "react-native";
import { twMerge } from "tailwind-merge";

import {
  ThemedView,
  ThemedText,
  Avatar,
  LucideIcon,
  Skeleton,
} from "@/components/ui/atoms";
import { BottomDrawer, ScreenHeader } from "@/components/ui/molecules";
import { useBottomDrawer } from "@/components/ui/molecules/bottom-drawer";
import { Colors } from "@/constants/colors";
import { useActiveChallenge } from "@/domains/challenge/challenge.api";
import { useHiscoresGet } from "@/domains/hiscores/hiscores.api";
import { useUserMe } from "@/domains/user/user.api";
import { getFullName } from "@/domains/user/user.utils";
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
const MAX_PAGE_FETCHES = 10;
const ROW_HEIGHT = 80;

export default function HiscoresScreen() {
  const intl = useIntl();
  const router = useRouter();
  const { data: user } = useUserMe();
  const {
    data: hiscoresData,
    isPending: isPendingHiscores,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useHiscoresGet();
  const { data: challenge } = useActiveChallenge();

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

  const [isOpen, setIsOpen] = useBottomDrawer();
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

  const jumpToMyRow = useCallback(async () => {
    if (!user) return;

    let currentHiscores =
      hiscoresData?.pages?.flatMap((p) => p?.items ?? []) ?? [];
    let currentIndex = currentHiscores.findIndex((h) => h.userId === user.id);

    if (currentIndex >= 0 && currentIndex < 3) {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
      return;
    }

    let fetches = 0;
    while (currentIndex < 0 && fetches < MAX_PAGE_FETCHES && hasNextPage) {
      const result = await fetchNextPage();
      fetches += 1;
      currentHiscores =
        result.data?.pages?.flatMap((p) => p?.items ?? []) ?? currentHiscores;
      currentIndex = currentHiscores.findIndex((h) => h.userId === user.id);
    }

    const listIndex = currentIndex - 3;
    if (listIndex >= 0) {
      listRef.current?.scrollToIndex({
        index: listIndex,
        animated: true,
        viewPosition: 0.3,
      });
    }
  }, [fetchNextPage, hasNextPage, hiscoresData, user]);

  const myListIndex = myHiscoreIndex - 3;
  const isMyRowLoaded = myHiscoreIndex >= 0;

  const isMyRowAboveViewport =
    isMyRowLoaded &&
    viewableRange !== null &&
    (myListIndex < 0
      ? viewableRange.first > 0
      : myListIndex < viewableRange.first);
  const isMyRowBelowViewport =
    !isMyRowLoaded ||
    (myListIndex >= 0 &&
      viewableRange !== null &&
      myListIndex > viewableRange.last);

  const showFab =
    !!user &&
    !!isVisibleOnHiscores &&
    (isMyRowBelowViewport || isMyRowAboveViewport);

  const scoreFormatter = useMemo(
    () => Intl.NumberFormat(intl.locale, { maximumFractionDigits: 2 }),
    [intl.locale],
  );
  const formatScore = useCallback(
    (score: number) => scoreFormatter.format(score),
    [scoreFormatter],
  );

  return (
    <ThemedView className="flex-1">
      <ScreenHeader />
      <FlatList
        ref={listRef}
        data={restOfList}
        initialNumToRender={25}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        getItemLayout={(_, index) => ({
          length: ROW_HEIGHT,
          offset: ROW_HEIGHT * index,
          index,
        })}
        onScrollToIndexFailed={({ index, averageItemLength }) => {
          listRef.current?.scrollToOffset({
            offset: index * (averageItemLength || ROW_HEIGHT),
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
            <View className="flex-row items-center justify-between px-6">
              <ThemedText className="text-4xl font-bold">
                <FormattedMessage defaultMessage="Hiscores" />
              </ThemedText>
              <TouchableOpacity onPress={() => setIsOpen((o) => !o)}>
                <LucideIcon icon={Info} size={22} muted />
              </TouchableOpacity>
              <BottomDrawer
                isOpen={isOpen}
                onRequestClose={() => setIsOpen(false)}
              >
                <View className="p-6">
                  <ThemedText className="mb-4">
                    <FormattedMessage defaultMessage="One summit of 1000 meters =" />{" "}
                    <ThemedText className="text-primary">
                      <FormattedMessage defaultMessage="100 points" />
                    </ThemedText>
                    .
                  </ThemedText>
                  <View className="flex-row items-center gap-2 rounded border border-border p-2">
                    <ThemedText className="text-sm">🔥</ThemedText>
                    <ThemedText>
                      <ThemedText className="font-medium text-primary">
                        <FormattedMessage defaultMessage="Essentials" />{" "}
                      </ThemedText>
                      <FormattedMessage defaultMessage="are worth x2. Summit them!" />
                    </ThemedText>
                  </View>
                </View>
              </BottomDrawer>
            </View>
            {user && !isVisibleOnHiscores && (
              <Link href="/user/me" asChild>
                <TouchableOpacity
                  className="mx-4 mt-4 flex-row items-center justify-between rounded border-2 border-primary p-4"
                >
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
        renderItem={({ index, item }) => {
          const rank = index + 4;
          const isMe = item.userId === user?.id;
          return (
            <TouchableOpacity
              onPress={() => router.push(`/user/${item.userId}`)}
              className={twMerge(
                "mx-4 mb-2 flex-row items-center gap-3 rounded-lg border border-border p-3",
                isMe && "border-primary bg-primary/10",
              )}
            >
              <Avatar
                size="md"
                initials={getInitials(
                  getFullName({
                    firstName: item.firstName,
                    lastName: item.lastName,
                  }),
                )}
                imageUrl={item.imageUrl}
              />
              <View className="flex-1">
                <ThemedText
                  className={twMerge("font-semibold", isMe && "text-primary")}
                  numberOfLines={1}
                >
                  <ThemedText className="font-semibold text-muted-foreground">
                    {rank}.{" "}
                  </ThemedText>
                  {getFullName({
                    firstName: item.firstName,
                    lastName: item.lastName,
                  })}
                </ThemedText>
                <View className="mt-0.5 flex-row items-center gap-1">
                  <LucideIcon icon={Mountain} muted size={14} />
                  <ThemedText className="text-sm text-muted-foreground">
                    <FormattedMessage
                      defaultMessage="{count} of {total}"
                      values={{
                        count: item.uniquePeaksCount,
                        total: challenge?.totalMountains ?? "—",
                      }}
                    />
                  </ThemedText>
                </View>
              </View>
              <ThemedText className="text-lg font-bold text-primary">
                {formatScore(item.totalScore)}
              </ThemedText>
            </TouchableOpacity>
          );
        }}
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
            <LucideIcon
              icon={isMyRowAboveViewport ? ArrowUp : ArrowDown}
              size={28}
              color="#ffffff"
            />
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
      <View className="flex-row items-center gap-3 rounded-lg border border-border p-3">
        <Skeleton className="size-12 rounded-full" />
        <View className="flex-1 gap-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-20" />
        </View>
        <Skeleton className="h-5 w-14" />
      </View>
      <View className="flex-row items-center gap-3 rounded-lg border border-border p-3">
        <Skeleton className="size-12 rounded-full" />
        <View className="flex-1 gap-2">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-20" />
        </View>
        <Skeleton className="h-5 w-14" />
      </View>
      <View className="flex-row items-center gap-3 rounded-lg border border-border p-3">
        <Skeleton className="size-12 rounded-full" />
        <View className="flex-1 gap-2">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-20" />
        </View>
        <Skeleton className="h-5 w-14" />
      </View>
    </View>
  );
}
