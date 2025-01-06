import { useEffect } from "react";
import { FormattedMessage } from "react-intl";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from "react-native-reanimated";
import { twMerge } from "tailwind-merge";

import { Header } from "@/components/navigation";
import {
  ThemedView,
  ThemedText,
  Avatar,
  Icon,
  Skeleton,
} from "@/components/ui/atoms";
import { useHiscoresGet } from "@/domains/hiscores/hiscores.api";
import { useUserMe } from "@/domains/user/user.api";
import { getFullName } from "@/domains/user/user.utils";
import { getInitials } from "@/lib/strings";

export default function HiscoresScreen() {
  const { data: user } = useUserMe();
  const { data: hiscores } = useHiscoresGet();

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
      <Header />
      <View>
        <Animated.FlatList
          data={hiscores ?? []}
          onScroll={onScroll}
          initialNumToRender={25}
          stickyHeaderIndices={[0]}
          ListHeaderComponent={
            <ThemedView className="px-6 pb-2">
              <ThemedText className="mb-2 text-4xl font-bold">
                <FormattedMessage defaultMessage="Hiscores" />
              </ThemedText>
              {!hiscores?.length && (
                <View className="mt-2 flex-row gap-3">
                  <Skeleton className="size-16  rounded-full" />
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
              <View className="relative mx-6 py-4">
                {index > 2 && (
                  <ThemedView className="absolute -left-3.5 top-2 z-10 size-7 items-center justify-center rounded-full border border-border">
                    <ThemedText className="font-semibold">
                      {index + 1}
                    </ThemedText>
                  </ThemedView>
                )}
                <View className="absolute -left-4 z-10">
                  {index === 0 && (
                    <ThemedText className="text-3xl">🥇</ThemedText>
                  )}
                  {index === 1 && (
                    <ThemedText className="text-3xl">🥈</ThemedText>
                  )}
                  {index === 2 && (
                    <ThemedText className="text-3xl">🥉</ThemedText>
                  )}
                </View>
                <View className="flex-1 flex-row items-center gap-3">
                  <Avatar
                    size="lg"
                    initials={getInitials(getFullName({ firstName, lastName }))}
                    imageUrl={imageUrl}
                    className={twMerge(isMe && "border-2 border-blue-500")}
                  />
                  <View className="flex-1 gap-2">
                    <ThemedText
                      className={twMerge(
                        "flex-1 text-xl font-semibold",
                        isMe && "text-blue-500",
                      )}
                      numberOfLines={1}
                    >
                      {getFullName({ firstName, lastName })}
                    </ThemedText>
                    <View className="flex-row items-center gap-2">
                      <View className="flex-row items-center gap-1 rounded-xl border-2 border-border px-2 py-1">
                        <View className="mr-1">
                          <Icon name="mountain.2.fill" muted size={18} />
                        </View>
                        <ThemedText>{uniquePeaksCount}</ThemedText>
                        <ThemedText className="font-medium text-muted-foreground">
                          <FormattedMessage defaultMessage="of" />
                        </ThemedText>
                        <ThemedText>522</ThemedText>
                      </View>
                      <View className="rounded-xl border-2 border-border bg-background px-2 py-1">
                        <ThemedText className="font-semibold text-primary">
                          {totalScore}
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            );
          }}
        />
      </View>
      <Animated.View className="absolute right-8 top-20" style={animatedStyle}>
        <ThemedText style={{ fontSize: 50 }}>🏆</ThemedText>
      </Animated.View>
    </ThemedView>
  );
}
