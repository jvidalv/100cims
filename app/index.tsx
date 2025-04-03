import AsyncStorage from "@react-native-async-storage/async-storage";
import { format } from "date-fns/format";
import { Link, useRouter } from "expo-router";
import { analytics } from "expofast-analytics";
import { useColorScheme } from "nativewind";
import { Fragment, useCallback, useEffect } from "react";
import { FormattedMessage } from "react-intl";
import { Pressable, TouchableOpacity, View } from "react-native";
import Animated, {
  SharedValue,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollViewOffset,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { twMerge } from "tailwind-merge";

import { useAuth } from "@/components/providers/auth-provider";
import { useChallenge } from "@/components/providers/challenge-provider";
import { Avatar, BlurView, Icon, Skeleton } from "@/components/ui/atoms";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { ThemedView } from "@/components/ui/atoms/themed-view";
import { MountainItemList } from "@/components/ui/molecules";
import { AvatarGroup } from "@/components/ui/molecules/avatar-group";
import {
  PlanItemList,
  PlanItemListSkeleton,
} from "@/components/ui/molecules/plan-item-list";
import { Colors } from "@/constants/colors";
import { useChallengesGet } from "@/domains/challenge/challenge.api";
import { useRecommendedPeaks } from "@/domains/mountain/mountain.api";
import { usePlanChatUnread } from "@/domains/plan/plan-chat.api";
import { useNewPlansCount, usePlans } from "@/domains/plan/plan.api";
import { useSummitsGet } from "@/domains/summit/summit.api";
import { useUserMe, useUserChallengeSummits } from "@/domains/user/user.api";
import { getFullName } from "@/domains/user/user.utils";
import { useIsCurrentScreen } from "@/hooks/use-is-current-screen";
import { useOnAppActive } from "@/hooks/use-on-app-active";
import { hasDynamicIsland } from "@/lib/device";
import { getInitials } from "@/lib/strings";

const MountainsDone = ({
  showAllMountains = true,
}: {
  showAllMountains?: boolean;
}) => {
  const { data: userSummits } = useUserChallengeSummits();

  const { data: user } = useUserMe();
  const { isAuthenticated } = useAuth();
  const { data: challenges } = useChallengesGet();
  const { challengeId } = useChallenge();

  const challenge = challenges?.find(
    (challenge) => challenge.id === challengeId,
  );

  return (
    <Link
      href={
        user ? { pathname: "/user/[user]", params: { user: user.id } } : "/join"
      }
      className="flex-row items-center gap-2"
    >
      {userSummits || !isAuthenticated ? (
        <View className="flex-row items-center gap-2">
          <View className="flex-row items-center gap-1 rounded-xl border-2 border-border px-2 py-1">
            <View className="mr-1 size-4 rounded-full bg-primary" />
            <ThemedText className="text-lg">
              {isAuthenticated ? userSummits?.essentialPeaksCount : 0}
            </ThemedText>
            <ThemedText className="text-lg font-medium text-muted-foreground">
              <FormattedMessage defaultMessage="of" />
            </ThemedText>
            <ThemedText className="text-lg">
              {challenge?.totalEssentialMountains}
            </ThemedText>
          </View>
          {showAllMountains && (
            <View className="flex-row items-center gap-1 rounded-xl border-2 border-border px-2 py-1">
              <View className="mr-1">
                <Icon name="mountain.2.fill" muted size={20} />
              </View>
              <ThemedText className="text-lg">
                {isAuthenticated ? userSummits?.uniquePeaksCount : 0}
              </ThemedText>
              <ThemedText className="text-lg font-medium text-muted-foreground">
                <FormattedMessage defaultMessage="of" />
              </ThemedText>
              <ThemedText className="text-lg">
                {challenge?.totalMountains}
              </ThemedText>
            </View>
          )}
        </View>
      ) : (
        <View className="flex-row gap-2">
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
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

  const plans = data?.data?.message;
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
      </View>
      <Link href="/plan/create" asChild>
        <TouchableOpacity className="flex-row items-center gap-1 pb-4 pt-6">
          <ThemedText className="text-muted-foreground">
            <FormattedMessage defaultMessage="Create a new plan" />
          </ThemedText>
          <Icon name="plus" size={12} weight="bold" muted />
        </TouchableOpacity>
      </Link>
    </View>
  );
};

const TOOLTIP_KEY = "challenges";

const AnimatedTooltip = () => {
  const router = useRouter();
  const translateX = useSharedValue(-20); // Start off-screen
  const opacity = useSharedValue(0);

  const showTooltip = useCallback(() => {
    translateX.value = withSpring(0);
    opacity.value = withTiming(1, { duration: 200 });
  }, [opacity, translateX]);

  const hideTooltip = useCallback(() => {
    translateX.value = withTiming(-20, { duration: 500 });
    opacity.value = withTiming(0, { duration: 500 });
    router.push({ pathname: "/challenges" });
  }, [opacity, router, translateX]);

  useEffect(() => {
    (async () => {
      if (!(await AsyncStorage.getItem(TOOLTIP_KEY))) {
        showTooltip();
        void AsyncStorage.setItem(TOOLTIP_KEY, "true");
      }
    })();
  }, [showTooltip]);

  const animatedTooltipStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={animatedTooltipStyle}
      className="absolute left-[85%] top-4 z-10 translate-y-1/2"
    >
      <Pressable
        onPress={hideTooltip}
        className="relative flex-row items-center rounded-xl bg-primary px-4 py-2 shadow"
      >
        <View className="absolute -left-3">
          <Icon
            name="arrow.backward"
            size={14}
            weight="bold"
            color={Colors.dark.primary}
          />
        </View>
        <ThemedText className="font-medium text-white">
          <FormattedMessage defaultMessage="Explore other challenges" />
        </ThemedText>
      </Pressable>
    </Animated.View>
  );
};

const TopSection = () => {
  const { challengeId } = useChallenge();
  const { data: challenges } = useChallengesGet();
  const challenge = challenges?.find(
    (challenge) => challenge.id === challengeId,
  );

  return (
    <Fragment>
      <Link href="/challenges" asChild>
        <ThemedText
          numberOfLines={1}
          className="-mt-1 text-4xl font-black tracking-tighter text-primary"
        >
          {challenge?.name}
        </ThemedText>
      </Link>
      <MountainsDone />
    </Fragment>
  );
};

const PageHeader = ({
  scrollOffset,
}: {
  scrollOffset: SharedValue<number>;
}) => {
  const { data: plansUnread } = usePlanChatUnread();
  const hasUnreadMessages = !!plansUnread?.data?.message?.length;
  const { data: user } = useUserMe();
  const fullName = user ? getFullName(user) : "";
  const { isAuthenticated } = useAuth();

  const { data: newPlansCount } = useNewPlansCount();

  const hasNewPlans = !!newPlansCount?.data?.count;

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

  const { setColorScheme, colorScheme } = useColorScheme();

  return (
    <BlurView
      className={twMerge(
        "absolute z-20 h-[7rem] w-full justify-end px-6 pb-2",
        hasDynamicIsland && "h-[7.5rem]",
      )}
    >
      <View className="flex-row items-center justify-between">
        <Animated.View className="flex-1" style={topLeftSectionStyle}>
          <MountainsDone showAllMountains={false} />
        </Animated.View>
        <View className="flex-1 flex-row items-center justify-end gap-2">
          <TouchableOpacity
            className="size-12 items-center justify-center rounded-full border-2 border-border opacity-80"
            onPress={() =>
              setColorScheme(colorScheme === "dark" ? "light" : "dark")
            }
          >
            {colorScheme === "dark" && (
              <Icon
                name="sun.max.fill"
                muted
                animationSpec={{ effect: { type: "bounce" } }}
              />
            )}
            {colorScheme === "light" && (
              <Icon
                name="moon.fill"
                muted
                animationSpec={{ effect: { type: "bounce" } }}
              />
            )}
          </TouchableOpacity>
          <Link href="/plans" asChild>
            <TouchableOpacity
              onPress={() => analytics.action("header-plans-clicked")}
              className="relative size-12 items-center justify-center rounded-full border-2 border-border opacity-80"
            >
              {hasNewPlans && (
                <View className="absolute -right-0.5 -top-0.5 size-4 rounded-full bg-blue-500" />
              )}
              <Icon
                name="backpack"
                muted
                animationSpec={
                  hasNewPlans
                    ? { effect: { type: "bounce" }, repeatCount: 3 }
                    : undefined
                }
              />
            </TouchableOpacity>
          </Link>
          <Link href={isAuthenticated ? "/user" : "/join"} asChild>
            <TouchableOpacity className="relative">
              <Avatar
                initials={
                  isAuthenticated && user
                    ? getInitials(fullName || user.email || "Y")
                    : "100"
                }
                className="bg-primary"
                imageUrl={user?.imageUrl}
              />
              {hasUnreadMessages && (
                <View className="absolute -right-0.5 -top-0.5 size-4 rounded-full bg-primary" />
              )}
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </BlurView>
  );
};

export default function IndexScreen() {
  const recommendedPeaks = useRecommendedPeaks();
  const { refetch: refetchUser } = useUserMe();
  const { refetch: refetchChallengeSummits } = useUserChallengeSummits();
  const { data: latestSummits, refetch: refetchLatestSummits } = useSummitsGet({
    limit: 4,
  });

  const isCurrentRoute = useIsCurrentScreen("/");

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
  const scrollOffset = useScrollViewOffset(scrollRef);

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
      <PageHeader scrollOffset={scrollOffset} />
      <Animated.ScrollView
        ref={scrollRef}
        className="px-6 pb-12"
        contentContainerClassName="gap-8"
        showsVerticalScrollIndicator={false}
      >
        <View className="h-24" />
        <Animated.View className="gap-0.5" style={scoreSectionStyle}>
          <View className="flex-row items-end justify-between">
            <View className="relative flex-row items-center">
              <AnimatedTooltip />
              <Link href="/challenges">
                <ThemedText className="text-2xl font-bold">
                  <FormattedMessage defaultMessage="Challenge" />
                </ThemedText>
              </Link>
              <Link href="/challenges" className="py-1.5 pl-1.5 pr-3">
                <Icon name="arrow.left.arrow.right" size={20} muted />
              </Link>
            </View>
            <Link href="/hiscores" className="z-10 -m-2 p-2 pb-4">
              <View className="flex-row items-center gap-1">
                <ThemedText className="text-muted-foreground">
                  <FormattedMessage defaultMessage="Hiscores" />
                </ThemedText>
                <Icon name="arrow.forward" size={12} weight="bold" muted />
              </View>
            </Link>
          </View>
          <TopSection />
        </Animated.View>
        {!!latestSummits?.length && (
          <View className="gap-4">
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
            <View className="gap-3">
              {latestSummits?.map(
                ({ summitId, mountainName, summitedAt, users }) => {
                  return (
                    <Link
                      href={{
                        pathname: "/user/summits/[summit]",
                        params: { summit: summitId },
                      }}
                      key={summitId}
                    >
                      <View className="flex-row items-center gap-4">
                        <View className="flex-1">
                          <ThemedText
                            className="flex-1 font-medium"
                            numberOfLines={1}
                          >
                            {mountainName}
                          </ThemedText>
                          <ThemedText className="text-sm text-muted-foreground">
                            {format(summitedAt, "dd MMM yyyy")}
                          </ThemedText>
                        </View>
                        <View className="ml-auto">
                          <AvatarGroup
                            size="sm"
                            items={users.map((user) => ({
                              name: getFullName(user),
                              imageUrl: user.imageUrl,
                            }))}
                          />
                        </View>
                      </View>
                    </Link>
                  );
                },
              )}
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
              ({ id, name, height, slug, imageUrl, essential, location }) => (
                <MountainItemList
                  key={id}
                  name={name}
                  height={height}
                  slug={slug}
                  imageUrl={imageUrl}
                  essential={essential}
                  location={location}
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
                <Icon name="arrow.forward" size={12} weight="bold" muted />
              </View>
            </Link>
          </View>
          <PlansSection />
        </View>
      </Animated.ScrollView>
    </ThemedView>
  );
}
