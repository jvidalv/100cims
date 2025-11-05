import { analytics } from "@jvidalv/react-analytics";
import { Link, useRouter } from "expo-router";
import { useEffect } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { TouchableOpacity, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from "react-native-reanimated";
import { twMerge } from "tailwind-merge";

import { useChallenge } from "@/components/providers/challenge-provider";
import {
  ThemedView,
  ThemedText,
  Avatar,
  Icon,
  Skeleton,
} from "@/components/ui/atoms";
import { BottomDrawer, ScreenHeader } from "@/components/ui/molecules";
import { useBottomDrawer } from "@/components/ui/molecules/bottom-drawer";
import { Colors } from "@/constants/colors";
import { useChallengesGet } from "@/domains/challenge/challenge.api";
import { useHiscoresGet } from "@/domains/hiscores/hiscores.api";
import { useUserMe } from "@/domains/user/user.api";
import { getFullName } from "@/domains/user/user.utils";
import { getInitials } from "@/lib/strings";

export default function HiscoresScreen() {
  const intl = useIntl();
  const router = useRouter();
  const { data: user } = useUserMe();
  const { data: hiscores, isPending: isPendingHiscores } = useHiscoresGet();
  const { data: challenges } = useChallengesGet();
  const { challengeId } = useChallenge();

  const challenge = challenges?.find(
    (challenge) => challenge.id === challengeId,
  );

  const [isOpen, setIsOpen] = useBottomDrawer();
  const isVisibleOnHiscores = user?.visibleOnHiscores;

  const scrollY = useSharedValue(0);
  const mounted = useSharedValue(-100); // Initial position for entry animation

  useEffect(() => {
    setTimeout(() => {
      mounted.value = withSpring(0, { damping: 5, stiffness: 80 });
    }, 125);
  }, [mounted]);

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(scrollY.value > 50 ? 0 : 1),
      transform: [
        {
          translateY:
            scrollY.value > 50
              ? withTiming(-100, { duration: 300 }) // Smooth disappearance
              : withSpring(5, { damping: 5, stiffness: 80 }), // Bounce effect on return
        },
        {
          translateY: mounted.value, // Entry animation from the top
        },
        {
          rotate:
            scrollY.value > 50
              ? withTiming("150deg", { duration: 300 })
              : withTiming("360deg", { duration: 300 }),
        },
      ],
    };
  });
  return (
    <ThemedView className="flex-1">
      <ScreenHeader />
      <Animated.FlatList
        data={hiscores ?? []}
        onScroll={onScroll}
        initialNumToRender={25}
        stickyHeaderIndices={[0]}
        ListHeaderComponent={
          <ThemedView className="px-6 pb-2">
            <View className="flex-row items-center gap-2">
              <ThemedText className="mb-2 text-4xl font-bold">
                <FormattedMessage defaultMessage="Hiscores" />
              </ThemedText>
              <TouchableOpacity
                className="-mt-1"
                onPress={() => setIsOpen((o) => !o)}
              >
                <Icon name="info.circle.fill" size={20} muted />
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
                  <View className="flex-row items-center gap-2 rounded-xl border border-border p-2">
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
                  onPress={() => {
                    analytics.action(
                      "alert-for-visible-on-hiscores-button-clicked",
                    );
                  }}
                  className="mb-4 flex-row items-center justify-between rounded-xl border-2 border-primary p-4"
                >
                  <ThemedText className="font-medium text-primary">
                    <FormattedMessage defaultMessage="I want to be visible on the hiscores" />
                  </ThemedText>
                  <Icon
                    name="arrow.forward"
                    weight="medium"
                    size={16}
                    color={Colors.dark.primary}
                  />
                </TouchableOpacity>
              </Link>
            )}
            {isPendingHiscores && (
              <View className="mt-4 flex-row gap-3">
                <Skeleton className="size-16 rounded-full" />
                <View className="gap-2">
                  <Skeleton className="h-6 w-40" />
                  <View className="flex-row gap-2">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-16" />
                  </View>
                </View>
              </View>
            )}
            {!isPendingHiscores && !hiscores?.length && (
              <ThemedText className="text-muted-foreground">
                <FormattedMessage defaultMessage="No one has yet reached the hiscores." />
              </ThemedText>
            )}
          </ThemedView>
        }
        scrollEventThrottle={16}
        ListFooterComponent={<View className="h-32" />}
        keyExtractor={({ userId }) => `${userId}`}
        renderItem={({
          index,
          item: {
            userId,
            firstName,
            lastName,
            uniquePeaksCount,
            totalScore,
            imageUrl,
          },
        }) => {
          const isMe = userId === user?.id;
          return (
            <TouchableOpacity
              className="relative mx-4"
              onPress={() => router.push(`/user/${userId}`)}
              style={{ height: 80 }}
            >
              <ThemedText
                className={twMerge(
                  "text-xl font-semibold mb-1",
                  isMe && "text-blue-500",
                )}
                numberOfLines={1}
              >
                <ThemedText className="text-muted-foreground text-xl">
                  {index + 1}.
                </ThemedText>{" "}
                {getFullName({ firstName, lastName })}
                {index === 0 && <ThemedText className="text-xl">🥇</ThemedText>}
                {index === 1 && <ThemedText className="text-xl">🥈</ThemedText>}
                {index === 2 && <ThemedText className="text-xl">🥉</ThemedText>}
              </ThemedText>
              <View className="flex-row items-center gap-3 relative">
                <Avatar
                  size="sm"
                  initials={getInitials(getFullName({ firstName, lastName }))}
                  imageUrl={imageUrl}
                  className={twMerge(isMe && "border-2 border-blue-500")}
                />
                <View className="flex-col gap-1">
                  <View className="flex-row items-center gap-2">
                    <View className="flex-row items-center gap-1 rounded-xl border-2 border-border px-2 py-1">
                      <View className="mr-1">
                        <Icon name="mountain.2.fill" muted size={18} />
                      </View>
                      <ThemedText>{uniquePeaksCount}</ThemedText>
                      <ThemedText className="font-medium text-muted-foreground">
                        <FormattedMessage defaultMessage="of" />
                      </ThemedText>
                      <ThemedText>{challenge?.totalMountains}</ThemedText>
                    </View>
                    <View className="rounded-xl border-2 border-border bg-background px-2 py-1">
                      <ThemedText className="font-semibold text-primary">
                        {Intl.NumberFormat(intl.locale, {
                          maximumFractionDigits: 2,
                        }).format(totalScore)}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
      <Animated.View className="absolute right-8 top-20" style={animatedStyle}>
        <ThemedText style={{ fontSize: 50 }}>🏆</ThemedText>
      </Animated.View>
    </ThemedView>
  );
}
