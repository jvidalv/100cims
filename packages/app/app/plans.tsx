import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  ActivityIndicator,
  View,
  Pressable,
  TouchableOpacity,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { twMerge } from "tailwind-merge";

import { useAuth } from "@/components/providers/auth-provider";
import { Icon, ThemedText, ThemedView } from "@/components/ui/atoms";
import { ScreenHeader } from "@/components/ui/molecules";
import {
  PlanItemList,
  PlanItemListSkeleton,
} from "@/components/ui/molecules/plan-item-list";
import {
  useMarkPlansAsVisited,
  usePlansInfinite,
} from "@/domains/plan/plan.api";
import { isAndroid } from "@/lib/device";

const ALERT_KEY = "plans_alert_shown";

const FloatingAlert = ({ onClose }: { onClose: () => void }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    const showTimeout = setTimeout(() => {
      opacity.value = withTiming(1, { duration: 300 });
      translateY.value = withTiming(0, { duration: 300 });

      const hideTimeout = setTimeout(() => {
        opacity.value = withTiming(0, { duration: 300 });
        translateY.value = withTiming(20, { duration: 300 }, (finished) => {
          if (finished) runOnJS(onClose)();
        });
      }, 7000);
      return () => clearTimeout(hideTimeout);
    }, 1500);

    return () => clearTimeout(showTimeout);
  }, [onClose, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const dismiss = () => {
    opacity.value = withTiming(0, { duration: 300 });
    translateY.value = withTiming(20, { duration: 300 }, (finished) => {
      if (finished) runOnJS(onClose)();
    });
  };

  return (
    <Animated.View
      style={animatedStyle}
      className="absolute inset-x-6 bottom-8 z-50"
    >
      <Pressable
        onPress={dismiss}
        className="relative rounded-xl bg-background p-4 shadow-md"
      >
        <View className="absolute right-2 top-2">
          <Icon
            name="star.fill"
            color="gold"
            size={24}
            animationSpec={{ effect: { type: "bounce" } }}
          />
        </View>
        <ThemedText className="mb-1 font-semibold">
          <FormattedMessage defaultMessage="Do you know?" />
        </ThemedText>
        <ThemedText>
          <FormattedMessage defaultMessage="Sharing plans with others is a great way to meet people with similar interests!" />
        </ThemedText>
      </Pressable>
    </Animated.View>
  );
};

export default function PlansScreen() {
  const intl = useIntl();
  const [status, setStatus] = useState<"open" | "completed" | "canceled">(
    "open",
  );
  const { isAuthenticated } = useAuth();
  const [showAlert, setShowAlert] = useState(false);
  const { mutate: markAsVisited } = useMarkPlansAsVisited();
  const {
    data,
    isPending: isPendingPlans,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = usePlansInfinite({ status });

  useEffect(() => {
    const checkAlert = async () => {
      const alreadyShown = await AsyncStorage.getItem(ALERT_KEY);
      if (!alreadyShown) {
        setShowAlert(true);
        await AsyncStorage.setItem(ALERT_KEY, "true");
      }
    };

    void checkAlert();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      markAsVisited();
    }
  }, [isAuthenticated, markAsVisited]);

  const statuses: { type: "open" | "completed" | "canceled"; name: string }[] =
    [
      {
        type: "open",
        name: intl.formatMessage({ defaultMessage: "Open" }),
      },
      {
        type: "completed",
        name: intl.formatMessage({ defaultMessage: "Completed" }),
      },
      {
        type: "canceled",
        name: intl.formatMessage({ defaultMessage: "Canceled" }),
      },
    ];

  const plans = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <ThemedView className="flex-1">
      <ScreenHeader />
      <Animated.FlatList
        data={plans}
        keyExtractor={(item) => item.id}
        contentContainerClassName="gap-3 px-6"
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            void fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <View className="pb-3">
            <View className="flex-row items-center justify-between mb-2">
              <ThemedText className="text-4xl font-bold">
                <FormattedMessage defaultMessage="All plans" />
              </ThemedText>
              <Link href="/plan/create" asChild>
                <TouchableOpacity className="flex-row items-center gap-1">
                  <ThemedText>
                    <FormattedMessage defaultMessage="New plan" />
                  </ThemedText>
                  <Icon
                    name="plus"
                    size={isAndroid ? 22 : 14}
                    animationSpec={{ effect: { type: "bounce" } }}
                  />
                </TouchableOpacity>
              </Link>
            </View>
            <View className="flex-row gap-1">
              {statuses.map(({ type, name }) => {
                const isSelected = status === type;
                return (
                  <Pressable
                    className={twMerge(
                      "rounded-lg py-2 px-2.5 mr-1 disabled:opacity-50",
                      isSelected ? "bg-primary" : "bg-border",
                    )}
                    onPress={() => setStatus(type)}
                    key={name}
                  >
                    <ThemedText
                      className={twMerge(
                        "font-medium text-foreground",
                        isSelected && "text-white",
                      )}
                    >
                      {name}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        }
        ListEmptyComponent={
          isPendingPlans ? (
            <View className="gap-3">
              <PlanItemListSkeleton />
              <PlanItemListSkeleton />
              <PlanItemListSkeleton />
              <PlanItemListSkeleton />
              <PlanItemListSkeleton />
              <PlanItemListSkeleton />
            </View>
          ) : status === "open" ? (
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
                    <View className="flex-row gap-2">
                      <ThemedText className="font-semibold text-blue-500">
                        <FormattedMessage defaultMessage="None" />
                      </ThemedText>
                    </View>
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
          ) : (
            <ThemedText>
              <FormattedMessage defaultMessage="No plans found for given status." />
            </ThemedText>
          )
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
        renderItem={({ item }) => (
          <PlanItemList
            id={item.id}
            title={item.title}
            status={item.status}
            startDate={item.startDate}
            mountains={item.mountains?.map(({ imageUrl }) => ({ imageUrl }))}
            users={item.users}
          />
        )}
      />
      {showAlert && <FloatingAlert onClose={() => setShowAlert(false)} />}
    </ThemedView>
  );
}
