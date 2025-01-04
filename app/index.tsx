import { format } from "date-fns/format";
import { BlurView } from "expo-blur";
import { Link } from "expo-router";
import { useColorScheme } from "nativewind";
import { Fragment } from "react";
import { TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedRef,
  useAnimatedStyle,
  useScrollViewOffset,
  withTiming,
} from "react-native-reanimated";

import { useAuth } from "@/components/providers/auth-provider";
import { Avatar, Icon, Skeleton } from "@/components/ui/atoms";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { ThemedView } from "@/components/ui/atoms/themed-view";
import { BottomDrawer, MountainItemList } from "@/components/ui/molecules";
import { AvatarGroup } from "@/components/ui/molecules/avatar-group";
import { useRecommendedPeaks } from "@/domains/mountain/mountain.api";
import { useSummitsGet } from "@/domains/summit/summit.api";
import { useUserMe, useUserSummits } from "@/domains/user/user.api";
import { getFullName } from "@/domains/user/user.utils";
import { getInitials } from "@/lib/strings";

const MountainsDone = () => {
  const { data: userSummits } = useUserSummits();

  const { isAuthenticated } = useAuth();

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
              of
            </ThemedText>
            <ThemedText className="text-lg">150</ThemedText>
          </View>
          <View className="flex-row items-center gap-1 rounded-xl border-2 border-border px-2 py-1">
            <View className="mr-1">
              <Icon name="mountain.2.fill" muted size={20} />
            </View>
            <ThemedText className="text-lg">
              {isAuthenticated ? userSummits?.uniquePeaksCount : 0}
            </ThemedText>
            <ThemedText className="text-lg font-medium text-muted-foreground">
              of
            </ThemedText>
            <ThemedText className="text-lg">522</ThemedText>
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
  const { data: userSummits } = useUserSummits();

  const { isAuthenticated } = useAuth();
  const score = isAuthenticated
    ? !userSummits
      ? "..."
      : userSummits?.score?.toFixed(1) || 0
    : "Not yet";

  return (
    <Fragment>
      <View className="-mt-1 flex-row items-center gap-2">
        <ThemedText className="text-5xl font-black text-primary">
          {score}
        </ThemedText>
      </View>
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
    <ThemedView>
      <BlurView className="absolute z-20 h-[7.5rem] w-full justify-end px-6 pb-2">
        <View className="flex-row items-center justify-between">
          <Animated.View style={topLeftSectionStyle}>
            <MountainsDone />
          </Animated.View>
          <View className="flex-row items-center gap-2">
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
      >
        <View className="h-24" />
        <Animated.View style={scoreSectionStyle}>
          <View className="flex-row items-end justify-between">
            <View className="flex-row items-center">
              <ThemedText className="text-2xl font-bold">Score</ThemedText>
              <BottomDrawer
                Trigger={({ setOpen }) => (
                  <TouchableOpacity
                    onPress={() => setOpen((o) => !o)}
                    className="py-1.5 pl-1.5 pr-3"
                  >
                    <Icon name="info.circle" size={20} muted />
                  </TouchableOpacity>
                )}
              >
                {() => (
                  <View className="p-6">
                    <ThemedText className="mb-4">
                      One mountain of 1000 meters ={" "}
                      <ThemedText className="text-primary">
                        100 points
                      </ThemedText>
                      .
                    </ThemedText>
                    <View className="flex-row items-center gap-2 rounded-xl border border-border p-2">
                      <ThemedText>🔥</ThemedText>
                      <ThemedText>
                        <ThemedText className="font-medium text-primary">
                          Essentials{" "}
                        </ThemedText>
                        are worth x2. Summit them!
                      </ThemedText>
                    </View>
                  </View>
                )}
              </BottomDrawer>
            </View>
            <Link href="/hiscores" className="-mx-2 -mb-2 p-2">
              <View className="flex-row items-center gap-1">
                <ThemedText className="text-muted-foreground">
                  Hiscores
                </ThemedText>
                <Icon name="arrow.forward" size={12} weight="bold" muted />
              </View>
            </Link>
          </View>
          <TopSection />
        </Animated.View>
        <View className="gap-4">
          <ThemedText className="text-2xl font-bold">Latest summits</ThemedText>
          <View className="gap-3">
            {latestSummits?.map(
              ({ summitId, mountainName, summitedAt, users }) => {
                return (
                  <View className="flex-row items-center gap-4" key={summitId}>
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
                );
              },
            )}
          </View>
        </View>
        <View className="gap-4">
          <View className="flex-row items-end justify-between">
            <ThemedText className="text-2xl font-bold">
              Peaks for you
            </ThemedText>
            <Link href="/mountains" className="-mx-2 -mb-2 p-2">
              <View className="flex-row items-center gap-1">
                <ThemedText className="text-muted-foreground">All</ThemedText>
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
