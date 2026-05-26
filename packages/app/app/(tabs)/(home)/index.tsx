import { Link, useIsFocused } from "expo-router";
import {
  ArrowRight,
  CircleDot,
  Moon,
  Mountain,
  Sun,
  Trophy,
} from "lucide-react-native";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  Appearance,
  Image,
  RefreshControl,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import Animated, {
  SharedValue,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollOffset,
  withTiming,
} from "react-native-reanimated";
import { twMerge } from "tailwind-merge";

import { useAuth } from "@/components/providers/auth-provider";
import { Avatar, BlurView, LucideIcon, Skeleton } from "@/components/ui/atoms";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { ThemedView } from "@/components/ui/atoms/themed-view";
import {
  ErrorState,
  MountainItemList,
  UpdatesDialog,
  type Update,
} from "@/components/ui/molecules";
import {
  PlanItemList,
  PlanItemListSkeleton,
} from "@/components/ui/molecules/plan-item-list";
import { useActiveChallenge } from "@/domains/challenge/challenge.api";
import {
  useMountains,
  useRecommendedPeaks,
} from "@/domains/mountain/mountain.api";
import { usePlanChatUnread } from "@/domains/plan/plan-chat.api";
import { usePlans } from "@/domains/plan/plan.api";
import { useSummitsGet } from "@/domains/summit/summit.api";
import {
  useUnseenUpdates,
  useMarkUpdateSeen,
} from "@/domains/update/update.api";
import {
  UNAUTHORIZED,
  useUserMe,
  useUserChallengeSummits,
} from "@/domains/user/user.api";
import { getFullName } from "@/domains/user/user.utils";
import { useOnAppActive } from "@/hooks/use-on-app-active";
import { getInitials } from "@/lib/strings";

const MountainsDone = ({
  showAllMountains = true,
}: {
  showAllMountains?: boolean;
}) => {
  const { data: userSummits } = useUserChallengeSummits();

  const { data: user } = useUserMe();
  const { isAuthenticated } = useAuth();
  const { data: challenge } = useActiveChallenge();

  return (
    <Link
      href={
        user ? { pathname: "/user/[user]", params: { user: user.id } } : "/join"
      }
      asChild
    >
      {userSummits || !isAuthenticated ? (
        <View className="flex-row gap-2">
          <View
            className={twMerge(
              "flex-row items-center gap-1 rounded border px-2 py-1",
              showAllMountains ? "border-border" : "border-transparent",
            )}
          >
            <LucideIcon icon={CircleDot} size={20} primary />
            <ThemedText>
              {isAuthenticated ? userSummits?.essentialPeaksCount : 0}
            </ThemedText>
            <ThemedText className="font-medium text-muted-foreground">
              <FormattedMessage defaultMessage="of" />
            </ThemedText>
            <ThemedText>{challenge?.totalEssentialMountains}</ThemedText>
          </View>
          {showAllMountains && (
            <View className="flex-row gap-1 rounded border px-2 py-1 border-border">
              <View>
                <LucideIcon icon={Mountain} size={20} muted />
              </View>
              <ThemedText>
                {isAuthenticated ? userSummits?.uniquePeaksCount : 0}
              </ThemedText>
              <ThemedText className="font-medium text-muted-foreground">
                <FormattedMessage defaultMessage="of" />
              </ThemedText>
              <ThemedText>{challenge?.totalMountains}</ThemedText>
            </View>
          )}
        </View>
      ) : (
        <View className="flex-row gap-2">
          <Skeleton className="h-8 w-28 rounded" />
          <Skeleton className="h-8 w-28 rounded" />
        </View>
      )}
    </Link>
  );
};

const PlansSection = () => {
  const { data, isPending } = usePlans({
    limit: 3,
    status: "open",
    sort: "upcoming",
  });

  const plans = data;
  return (
    <View>
      <View className="gap-3">
        {isPending && (
          <>
            <PlanItemListSkeleton />
            <PlanItemListSkeleton />
            <PlanItemListSkeleton />
          </>
        )}
        {plans?.map(
          ({
            id,
            title,
            imageUrl,
            status,
            type,
            startDate,
            isPrivate,
            mountains,
            users,
          }) => (
            <PlanItemList
              key={id}
              id={id}
              title={title}
              imageUrl={imageUrl}
              status={status}
              type={type}
              startDate={startDate}
              isPrivate={isPrivate}
              mountains={mountains?.map(({ imageUrl }) => ({ imageUrl }))}
              users={users}
            />
          ),
        )}
        {!isPending && !plans?.length && (
          <Link href="/plans/create" asChild>
            <TouchableOpacity className="flex-row gap-4">
              <View
                className="items-center justify-center bg-border"
                style={{ width: 100, height: 100, borderRadius: 6 }}
              >
                <ThemedText className="text-5xl">+</ThemedText>
              </View>
              <View className="flex-1 justify-center">
                <View className="items-start gap-1">
                  <ThemedText
                    numberOfLines={2}
                    className="text-lg font-semibold tracking-tight"
                  >
                    <FormattedMessage defaultMessage="Create your first plan" />
                  </ThemedText>
                </View>
              </View>
            </TouchableOpacity>
          </Link>
        )}
      </View>
    </View>
  );
};

const TopSection = () => {
  const { data: challenge } = useActiveChallenge();

  return (
    <Fragment>
      {challenge?.id ? (
        <Link
          href={{ pathname: "/challenge/[id]", params: { id: challenge.id } }}
          asChild
        >
          <ThemedText
            numberOfLines={1}
            className="text-4xl font-black tracking-tighter text-primary"
          >
            {challenge.name}
          </ThemedText>
        </Link>
      ) : (
        <ThemedText
          numberOfLines={1}
          className="text-4xl font-black tracking-tighter text-primary"
        >
          {challenge?.name}
        </ThemedText>
      )}
      <MountainsDone />
    </Fragment>
  );
};

const ThemeToggleButton = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  return (
    <TouchableOpacity
      onPress={() => Appearance.setColorScheme(isDark ? "light" : "dark")}
      className="size-10 items-center justify-center rounded-full border-2 border-border"
    >
      <LucideIcon icon={isDark ? Sun : Moon} muted />
    </TouchableOpacity>
  );
};

const PageHeader = ({
  scrollOffset,
}: {
  scrollOffset: SharedValue<number>;
}) => {
  const { data: plansUnread } = usePlanChatUnread();
  const hasUnreadMessages = !!plansUnread?.length;
  const { data: user } = useUserMe();
  const fullName = user ? getFullName(user) : "";
  const { isAuthenticated } = useAuth();

  const topLeftSectionStyle = useAnimatedStyle(() => {
    if (scrollOffset.value > 100) {
      return {
        opacity: withTiming(1, { duration: 200 }),
      };
    }
    return {
      opacity: withTiming(0, { duration: 300 }),
    };
  });

  return (
    <BlurView className="absolute z-20 h-28 w-full justify-end px-6 pb-2">
      <View className="flex-row items-center justify-between">
        <Animated.View className="flex-1" style={topLeftSectionStyle}>
          <MountainsDone showAllMountains={false} />
        </Animated.View>
        <View className="flex-1 flex-row items-center justify-end gap-2">
          <ThemeToggleButton />
          <Link href="/hiscores" asChild>
            <TouchableOpacity className="size-10 items-center justify-center rounded-full border-2 border-border">
              <LucideIcon icon={Trophy} muted />
            </TouchableOpacity>
          </Link>
          <Link href={isAuthenticated ? "/user" : "/join"} asChild>
            <TouchableOpacity className="relative">
              <Avatar
                size="sm"
                initials={
                  isAuthenticated && user
                    ? getInitials(fullName || user.email || "Y")
                    : "100"
                }
                className="bg-primary"
                imageUrl={user?.imageUrl}
              />
              {hasUnreadMessages && (
                <View className="absolute -right-0.5 -top-0.5 size-3 rounded-full bg-primary" />
              )}
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </BlurView>
  );
};

// All available updates - source of truth for update content (oldest first)
type AppUpdate = {
  id: string;
  date: string;
};

const UPDATES: AppUpdate[] = [
  {
    id: "update-005",
    date: "2026-04-17",
  },
];

const UPDATE_IDS = UPDATES.map((u) => u.id);

const RecommendedMountainSkeleton = () => (
  <View className="flex-row gap-4">
    <Skeleton className="rounded" style={{ width: 100, height: 100 }} />
    <View className="flex-1 justify-center gap-1">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-5 w-1/2" />
      <Skeleton className="mt-1 h-5 w-1/3" />
    </View>
  </View>
);

export default function IndexScreen() {
  const intl = useIntl();
  const { isAuthenticated } = useAuth();
  const recommendedPeaks = useRecommendedPeaks();
  const {
    isError: isUserMeError,
    error: userMeError,
    refetch: refetchUser,
  } = useUserMe();
  const { refetch: refetchChallengeSummits } = useUserChallengeSummits();
  const {
    data: latestSummits,
    isPending: isPendingLatestSummits,
    isError: isSummitsError,
    error: summitsError,
    refetch: refetchLatestSummits,
  } = useSummitsGet({
    limit: 8,
  });
  const {
    isPending: isPendingMountains,
    isError: isMountainsError,
    error: mountainsError,
    refetch: refetchMountains,
  } = useMountains();

  const isUnauthorized = userMeError?.message === UNAUTHORIZED;
  const hasFatalError =
    !isUnauthorized && (isUserMeError || isMountainsError || isSummitsError);
  const fatalError = userMeError ?? mountainsError ?? summitsError;

  const isCurrentRoute = useIsFocused();

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Updates system - fetch unseen updates from API
  const { data: unseenUpdateIds } = useUnseenUpdates(UPDATE_IDS);
  const { mutate: markUpdateSeen } = useMarkUpdateSeen();

  // Find the first unseen update to show
  const currentUnseenUpdate = useMemo(() => {
    if (!unseenUpdateIds?.length) return null;
    const unseenId = unseenUpdateIds[0];
    return UPDATES.find((u) => u.id === unseenId) || null;
  }, [unseenUpdateIds]);

  // Translated content for the current update
  const currentUpdateContent = useMemo(() => {
    if (!currentUnseenUpdate) return null;
    if (currentUnseenUpdate.id === "update-005") {
      return {
        title: intl.formatMessage({ defaultMessage: "What's new" }),
        body: intl.formatMessage({
          defaultMessage:
            "Fresh new look. You can now edit summits, create community challenges, and add your own mountains. Share summits and your profile straight to social.",
        }),
        actionLabel: intl.formatMessage({ defaultMessage: "Explore" }),
      };
    }
    return null;
  }, [currentUnseenUpdate, intl]);

  const showUpdatesDialog =
    isAuthenticated && !!currentUnseenUpdate && !!currentUpdateContent;
  const hasMoreUnseenUpdates = (unseenUpdateIds?.length ?? 0) > 1;

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      refetchUser(),
      refetchLatestSummits(),
      refetchChallengeSummits(),
    ]);
    setIsRefreshing(false);
  }, [refetchUser, refetchLatestSummits, refetchChallengeSummits]);

  const updateWithImage = useMemo((): Update | null => {
    if (!currentUnseenUpdate || !currentUpdateContent) return null;
    return {
      id: currentUnseenUpdate.id,
      title: currentUpdateContent.title,
      date: currentUnseenUpdate.date,
      body: currentUpdateContent.body,
      imageUrl: require("@/assets/images/shop-header.jpg"),
    };
  }, [currentUnseenUpdate, currentUpdateContent]);

  useOnAppActive(() => {
    void refetchUser();
    void refetchLatestSummits();
    void refetchChallengeSummits();
  });

  useEffect(() => {
    if (isCurrentRoute) {
      void refetchLatestSummits();
      void refetchChallengeSummits();
      void refetchUser();
    }
  }, [
    isCurrentRoute,
    refetchChallengeSummits,
    refetchLatestSummits,
    refetchUser,
  ]);

  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollOffset = useScrollOffset(scrollRef);

  const scoreSectionStyle = useAnimatedStyle(() => {
    if (scrollOffset.value > 100) {
      return {
        opacity: withTiming(0, { duration: 300 }),
      };
    }
    return {
      opacity: withTiming(1, { duration: 200 }),
    };
  });

  if (hasFatalError) {
    return (
      <ThemedView className="flex-1">
        <ErrorState
          context="home"
          error={fatalError}
          onReload={() => {
            void refetchUser();
            void refetchMountains();
            void refetchLatestSummits();
            void refetchChallengeSummits();
          }}
        />
      </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1">
      {updateWithImage && currentUnseenUpdate && currentUpdateContent && (
        <UpdatesDialog
          update={updateWithImage}
          isOpen={showUpdatesDialog}
          onClose={() => {
            markUpdateSeen(currentUnseenUpdate.id);
          }}
          actionLabel={
            hasMoreUnseenUpdates
              ? intl.formatMessage({ defaultMessage: "Next" })
              : currentUpdateContent.actionLabel
          }
          onAction={() => {
            markUpdateSeen(currentUnseenUpdate.id);
          }}
        />
      )}
      <PageHeader scrollOffset={scrollOffset} />
      <Animated.ScrollView
        ref={scrollRef}
        contentContainerClassName="gap-8 px-6 pb-12"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        <View className="h-24" />
        <Animated.View className="gap-0.5" style={scoreSectionStyle}>
          <View className="flex-row items-end justify-between">
            <ThemedText className="text-2xl font-bold">
              <FormattedMessage defaultMessage="Challenge" />
            </ThemedText>
            <Link href="/challenges" className="z-10 -m-2 p-2 pb-4">
              <View className="flex-row items-center gap-1">
                <ThemedText className="text-muted-foreground">
                  <FormattedMessage defaultMessage="More" />
                </ThemedText>
                <LucideIcon icon={ArrowRight} size={12} muted />
              </View>
            </Link>
          </View>
          <TopSection />
        </Animated.View>
        {(isPendingLatestSummits || !!latestSummits?.length) && (
          <View className="flex-1 gap-4">
            <View className="flex-row items-center justify-between">
              <ThemedText className="text-2xl font-bold">
                <FormattedMessage defaultMessage="Latest summits" />
              </ThemedText>
              <Link href="/summits" className="z-10 -mx-2 px-2">
                <View className="flex-row items-center gap-1">
                  <ThemedText className="text-muted-foreground">
                    <FormattedMessage defaultMessage="More" />
                  </ThemedText>
                  <LucideIcon icon={ArrowRight} size={12} muted />
                </View>
              </Link>
            </View>
            <View className="flex-1 flex-row flex-wrap gap-2">
              {isPendingLatestSummits
                ? Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 w-[23%] rounded" />
                  ))
                : latestSummits?.map(({ summitId, summitImageUrl }) => (
                    <Link
                      href={{
                        pathname: "/user/summits/[summit]",
                        params: { summit: summitId },
                      }}
                      key={summitId}
                      className="w-[23%]"
                    >
                      <Image
                        source={{ uri: summitImageUrl }}
                        className="h-24 w-full rounded bg-neutral-300 dark:bg-neutral-800"
                        style={{
                          resizeMode: "center",
                        }}
                      />
                    </Link>
                  ))}
            </View>
          </View>
        )}
        <View className="gap-4">
          <View className="flex-row items-end justify-between">
            <ThemedText className="text-2xl font-bold">
              <FormattedMessage defaultMessage="Recommended" />
            </ThemedText>
            <Link href="/mountains" className="-mx-2 -mb-2 p-2">
              <View className="flex-row items-center gap-1">
                <ThemedText className="text-muted-foreground">
                  <FormattedMessage defaultMessage="All" />
                </ThemedText>
                <LucideIcon icon={ArrowRight} size={12} muted />
              </View>
            </Link>
          </View>
          <View className="gap-2">
            {isPendingMountains && !recommendedPeaks?.length
              ? Array.from({ length: 3 }).map((_, i) => (
                  <RecommendedMountainSkeleton key={i} />
                ))
              : recommendedPeaks?.map(
                  ({
                    id,
                    name,
                    height,
                    slug,
                    imageUrl,
                    essential,
                    location,
                    latitude,
                    longitude,
                  }) => (
                    <MountainItemList
                      key={id}
                      name={name}
                      height={height}
                      slug={slug}
                      imageUrl={imageUrl}
                      essential={essential}
                      location={location}
                      latitude={latitude}
                      longitude={longitude}
                    />
                  ),
                )}
          </View>
        </View>
        <View className="gap-4 pb-16">
          <View className="flex-row items-end justify-between">
            <ThemedText className="text-2xl font-bold">
              <FormattedMessage defaultMessage="Upcoming plans" />
            </ThemedText>
            <Link href="/plans" className="-mx-2 -mb-2 p-2">
              <View className="flex-row items-center gap-1">
                <ThemedText className="text-muted-foreground">
                  <FormattedMessage defaultMessage="All plans" />
                </ThemedText>
                <LucideIcon icon={ArrowRight} size={12} muted />
              </View>
            </Link>
          </View>
          <PlansSection />
        </View>
      </Animated.ScrollView>
    </ThemedView>
  );
}
