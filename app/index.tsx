import { format } from "date-fns/format";
import { Link } from "expo-router";
import { useColorScheme } from "nativewind";
import { Fragment } from "react";
import { FormattedMessage } from "react-intl";
import { TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedRef,
  useAnimatedStyle,
  useScrollViewOffset,
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
import { useChallengesGet } from "@/domains/challenge/challenge.api";
import { useRecommendedPeaks } from "@/domains/mountain/mountain.api";
import { useSummitsGet } from "@/domains/summit/summit.api";
import { useUserMe, useUserChallengeSummits } from "@/domains/user/user.api";
import { getFullName } from "@/domains/user/user.utils";
import { hasDynamicIsland } from "@/lib/device";
import { getInitials } from "@/lib/strings";

const MountainsDone = () => {
  const { data: userSummits } = useUserChallengeSummits();

  const { isAuthenticated } = useAuth();
  const { data: challenges } = useChallengesGet();
  const { challengeId } = useChallenge();

  const challenge = challenges?.find(
    (challenge) => challenge.id === challengeId,
  );

  return (
    <Link
      href={isAuthenticated ? "/user/summits" : "/join"}
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
          className="flex-1 text-4xl font-black tracking-tighter text-primary"
        >
          {challenge?.name}
        </ThemedText>
      </Link>
      <MountainsDone />
    </Fragment>
  );
};

export default function IndexScreen() {
  const recommendedPeaks = useRecommendedPeaks();
  const { isAuthenticated } = useAuth();
  const { data: user } = useUserMe();
  const fullName = user ? getFullName(user) : "";

  const { data: latestSummits } = useSummitsGet({ limit: 5 });

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
    <ThemedView className="flex-1">
      <BlurView
        className={twMerge(
          "absolute z-20 h-[7rem] w-full justify-end px-6 pb-2",
          hasDynamicIsland && "h-[7.5rem]",
        )}
      >
        <View className="flex-row items-center justify-between">
          <Animated.View className="flex-1" style={topLeftSectionStyle}>
            <MountainsDone />
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
            <Link href={isAuthenticated ? "/user" : "/join"}>
              <Avatar
                initials={
                  isAuthenticated && user
                    ? getInitials(fullName || user.email || "Y")
                    : "🏔️"
                }
                imageUrl={user?.imageUrl}
              />
            </Link>
          </View>
        </View>
      </BlurView>
      <Animated.ScrollView
        ref={scrollRef}
        className="gap-10 px-6 pb-12"
        contentContainerClassName="gap-10"
        showsVerticalScrollIndicator={false}
      >
        <View className="h-24" />
        <Animated.View className="gap-0.5" style={scoreSectionStyle}>
          <View className="flex-row items-end justify-between">
            <View className="flex-row items-center">
              <Link href="/challenges">
                <ThemedText className="text-2xl font-bold">
                  <FormattedMessage defaultMessage="Challenge" />
                </ThemedText>
              </Link>
              <Link href="/challenges" className="py-1.5 pl-1.5 pr-3">
                <Icon name="arrow.left.arrow.right" size={20} muted />
              </Link>
            </View>
            <Link href="/hiscores" className="-mx-2 -mb-2 p-2">
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
            <ThemedText className="text-2xl font-bold">
              <FormattedMessage defaultMessage="Latest summits" />
            </ThemedText>
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
          <View className="gap-4 pb-16">
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
      </Animated.ScrollView>
    </ThemedView>
  );
}
