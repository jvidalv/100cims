import { Link, useRouter } from "expo-router";
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
import { Avatar, BlurView, Icon, Skeleton } from "@/components/ui/atoms";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { ThemedView } from "@/components/ui/atoms/themed-view";
import {
  MountainItemList,
  UpdatesDialog,
  type Update,
} from "@/components/ui/molecules";
import {
  PlanItemList,
  PlanItemListSkeleton,
} from "@/components/ui/molecules/plan-item-list";
import { useActiveChallenge } from "@/domains/challenge/challenge.api";
import { useMerch } from "@/domains/merch/merch.api";
import {
  useMountains,
  useRecommendedPeaks,
} from "@/domains/mountain/mountain.api";
import { usePlanChatUnread } from "@/domains/plan/plan-chat.api";
import { useNewPlansCount, usePlans } from "@/domains/plan/plan.api";
import { useSummitsGet } from "@/domains/summit/summit.api";
import { useUnseenUpdates, useMarkUpdateSeen } from "@/domains/update/update.api";
import {
  useUserMe,
  useUserChallengeSummits,
} from "@/domains/user/user.api";
import { getFullName } from "@/domains/user/user.utils";
import { useIsCurrentScreen } from "@/hooks/use-is-current-screen";
import { useMapNotificationBadge } from "@/hooks/use-map-notification-badge";
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
      className="flex-row items-center gap-2"
    >
      {userSummits || !isAuthenticated ? (
        <View className="flex-row items-center gap-2">
          <View
            className={twMerge(
              "flex-row items-center gap-1 rounded-xl border-2 px-2 py-1",
              showAllMountains ? "border-border" : "border-transparent",
            )}
          >
            <View className="mr-0.5 size-4 rounded-full bg-primary" />
            <ThemedText>
              {isAuthenticated ? userSummits?.essentialPeaksCount : 0}
            </ThemedText>
            <ThemedText className="font-medium text-muted-foreground">
              <FormattedMessage defaultMessage="of" />
            </ThemedText>
            <ThemedText>{challenge?.totalEssentialMountains}</ThemedText>
          </View>
          {showAllMountains && (
            <View className="flex-row items-center gap-1 rounded-xl border-2 border-border px-2 py-1">
              <View>
                <Icon name="mountain.2.fill" muted size={20} />
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
          <Skeleton className="h-8 w-28 rounded-xl" />
          <Skeleton className="h-8 w-28 rounded-xl" />
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
        {plans?.map(({ id, title, status, startDate, mountains, users }) => (
          <PlanItemList
            key={id}
            id={id}
            title={title}
            status={status}
            startDate={startDate}
            mountains={mountains?.map(({ imageUrl }) => ({ imageUrl }))}
            users={users}
          />
        ))}
        {!isPending && !plans?.length && (
          <Link href="/plan/create" asChild>
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

const FALLBACK_UPDATE_IMAGE =
  "https://josepvidal-public-dev-bucket.s3.eu-west-3.amazonaws.com/100cims/mountain/profile/el-tossal-gros.jpg";

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
            className="-mt-1 text-4xl font-black tracking-tighter text-primary"
          >
            {challenge.name}
          </ThemedText>
        </Link>
      ) : (
        <ThemedText
          numberOfLines={1}
          className="-mt-1 text-4xl font-black tracking-tighter text-primary"
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
      <Icon name={isDark ? "sun.max.fill" : "moon.fill"} muted />
    </TouchableOpacity>
  );
};

const PageHeader = ({
  scrollOffset,
  showBadge,
  markAsSeen,
}: {
  scrollOffset: SharedValue<number>;
  showBadge: boolean;
  markAsSeen: () => void;
}) => {
  const { data: plansUnread } = usePlanChatUnread();
  const hasUnreadMessages = !!plansUnread?.length;
  const { data: user } = useUserMe();
  const fullName = user ? getFullName(user) : "";
  const { isAuthenticated } = useAuth();

  const { data: newPlansCount } = useNewPlansCount();

  const hasNewPlans = !!newPlansCount?.count;

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
            <TouchableOpacity
              className="size-10 items-center justify-center rounded-full border-2 border-border"
            >
              <Icon name="trophy.fill" muted />
            </TouchableOpacity>
          </Link>
          <Link
            href={{ pathname: "/mountains", params: { view: "map" } }}
            asChild
          >
            <TouchableOpacity
              onPress={() => {
                void markAsSeen();
              }}
              className="relative size-10 items-center justify-center rounded-full border-2 border-border"
            >
              {showBadge && (
                <View className="absolute -right-0.5 -top-0.5 size-3 rounded-full bg-yellow-400" />
              )}
              <Icon name="map" muted />
            </TouchableOpacity>
          </Link>
          <Link href="/plans" asChild>
            <TouchableOpacity
              className="relative size-10 items-center justify-center rounded-full border-2 border-border"
            >
              {hasNewPlans && (
                <View className="absolute -right-0.5 -top-0.5 size-3 rounded-full bg-blue-500" />
              )}
              <Icon name="backpack" muted />
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
  actionRoute: "/challenges";
};

const UPDATES: AppUpdate[] = [
  {
    id: "update-002",
    date: "2025-01-20",
    actionRoute: "/challenges",
  },
  {
    id: "update-003",
    date: "2025-01-21",
    actionRoute: "/challenges",
  },
];

const UPDATE_IDS = UPDATES.map((u) => u.id);

export default function IndexScreen() {
  const intl = useIntl();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const recommendedPeaks = useRecommendedPeaks();
  const { refetch: refetchUser } = useUserMe();
  const { refetch: refetchChallengeSummits } = useUserChallengeSummits();
  const { data: latestSummits, refetch: refetchLatestSummits } = useSummitsGet({
    limit: 8,
  });
  const { data: mountains } = useMountains();
  const { data: merch } = useMerch();
  const featuredMerch = (merch ?? [])
    .filter((m) => m.featured != null)
    .sort((a, b) => (a.featured ?? 0) - (b.featured ?? 0))
    .slice(0, 5);

  const isCurrentRoute = useIsCurrentScreen("/");
  const { showBadge, markAsSeen } = useMapNotificationBadge();

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
    // Map update IDs to their translated content
    if (currentUnseenUpdate.id === "update-003") {
      return {
        title: intl.formatMessage({ defaultMessage: "Patch notes" }),
        body: intl.formatMessage({
          defaultMessage:
            "Fixed profile image uploads, added Cim de la Dona, new height filters, anonymous photo reactions, and merchandising support!",
        }),
        actionLabel: intl.formatMessage({ defaultMessage: "View" }),
      };
    }
    if (currentUnseenUpdate.id === "update-002") {
      return {
        title: intl.formatMessage({ defaultMessage: "Community challenges" }),
        body: intl.formatMessage({
          defaultMessage:
            "You can now create your own challenges and also your mountains, other people can join these challenges!",
        }),
        actionLabel: intl.formatMessage({ defaultMessage: "Explore" }),
      };
    }
    return null;
  }, [currentUnseenUpdate, intl]);

  const showUpdatesDialog = isAuthenticated && !!currentUnseenUpdate && !!currentUpdateContent;
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

  // Get a stable image for the updates dialog based on update id
  const updateWithImage = useMemo((): Update | null => {
    if (!currentUnseenUpdate || !currentUpdateContent) return null;

    // Use update id hash to pick a stable image index
    const imageIndex = mountains?.length
      ? currentUnseenUpdate.id.charCodeAt(currentUnseenUpdate.id.length - 1) %
        mountains.length
      : 0;
    const stableImage = mountains?.[imageIndex]?.imageUrl;

    return {
      id: currentUnseenUpdate.id,
      title: currentUpdateContent.title,
      date: currentUnseenUpdate.date,
      body: currentUpdateContent.body,
      imageUrl: stableImage || FALLBACK_UPDATE_IMAGE,
    };
  }, [currentUnseenUpdate, currentUpdateContent, mountains]);

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
            if (!hasMoreUnseenUpdates) {
              router.push(currentUnseenUpdate.actionRoute);
            }
          }}
        />
      )}
      <PageHeader
        scrollOffset={scrollOffset}
        showBadge={showBadge}
        markAsSeen={markAsSeen}
      />
      <Animated.ScrollView
        ref={scrollRef}
        className="px-6 pb-12"
        contentContainerClassName="gap-8"
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
                <Icon name="arrow.forward" size={12} weight="bold" muted />
              </View>
            </Link>
          </View>
          <TopSection />
        </Animated.View>
        {!!latestSummits?.length && (
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
                  <Icon name="arrow.forward" size={12} weight="bold" muted />
                </View>
              </Link>
            </View>
            <View className="flex-1 gap-2 flex-row flex-wrap">
              {latestSummits?.map(({ summitId, summitImageUrl }) => {
                return (
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
                      className="w-full h-24 rounded bg-neutral-300 dark:bg-neutral-800"
                      style={{
                        resizeMode: "center",
                      }}
                    />
                  </Link>
                );
              })}
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
                <Icon name="arrow.forward" size={12} weight="bold" muted />
              </View>
            </Link>
          </View>
          <View className="gap-2">
            {recommendedPeaks?.map(
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
        <View className="gap-4">
          <View className="flex-row items-end justify-between">
            <ThemedText className="text-2xl font-bold">
              <FormattedMessage defaultMessage="Upcoming plans" />
            </ThemedText>
            <Link href="/plans" className="-mx-2 -mb-2 p-2">
              <View className="flex-row items-center gap-1">
                <ThemedText className="text-muted-foreground">
                  <FormattedMessage defaultMessage="All plans" />
                </ThemedText>
                <Icon name="arrow.forward" size={12} weight="bold" muted />
              </View>
            </Link>
          </View>
          <PlansSection />
        </View>
        {featuredMerch.length > 0 && (
          <View className="gap-4 pb-16">
            <View className="flex-row items-end justify-between">
              <ThemedText className="text-2xl font-bold">
                <FormattedMessage defaultMessage="Support Cims" />
              </ThemedText>
              <Link href="/support" className="-mx-2 -mb-2 p-2">
                <View className="flex-row items-center gap-1">
                  <ThemedText className="text-muted-foreground">
                    <FormattedMessage defaultMessage="View all" />
                  </ThemedText>
                  <Icon name="arrow.forward" size={12} weight="bold" muted />
                </View>
              </Link>
            </View>
            <Link href="/support">
              <View className="gap-2">
                <View className="aspect-square w-full overflow-hidden rounded-xl bg-border">
                  {featuredMerch[0]?.imageUrls[0] && (
                    <Image
                      source={{ uri: featuredMerch[0].imageUrls[0] }}
                      className="size-full"
                      resizeMode="cover"
                    />
                  )}
                </View>
                <View className="flex-row gap-2">
                  {featuredMerch.slice(1, 3).map((product) => (
                    <Image
                      key={product.slug}
                      source={{ uri: product.imageUrls[0] }}
                      className="aspect-square flex-1 rounded-xl bg-border"
                      resizeMode="cover"
                    />
                  ))}
                </View>
                <View className="flex-row gap-2">
                  {featuredMerch.slice(3).map((product) => (
                    <Image
                      key={product.slug}
                      source={{ uri: product.imageUrls[0] }}
                      className="aspect-square flex-1 rounded-xl bg-border"
                      resizeMode="cover"
                    />
                  ))}
                </View>
              </View>
            </Link>
          </View>
        )}
      </Animated.ScrollView>
    </ThemedView>
  );
}
