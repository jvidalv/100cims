import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { View, Pressable, TouchableOpacity } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { twMerge } from "tailwind-merge";

import { useAuth } from "@/components/providers/auth-provider";
import { Icon, ThemedText } from "@/components/ui/atoms";
import {
  PlanItemList,
  PlanItemListSkeleton,
} from "@/components/ui/molecules/plan-item-list";
import ParallaxScrollView from "@/components/ui/organisms/parallax-scroll-view";
import { useMarkPlansAsVisited, usePlans } from "@/domains/plan/plan.api";
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
  const [status, setStatus] = useState("open");
  const { isAuthenticated } = useAuth();
  const [showAlert, setShowAlert] = useState(false);
  const { mutate: markAsVisited } = useMarkPlansAsVisited();
  const { data, isPending: isPendingPlans } = usePlans({ status });

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

  const statuses = [
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

  return (
    <>
      <ParallaxScrollView
        title={intl.formatMessage({ defaultMessage: "Plans" })}
        headerClassName="flex items-center justify-center bg-blue-500"
        contentClassName="pt-4 pb-28"
        parallaxRightElement={
          <Link href="/plan/create" asChild>
            <TouchableOpacity className="flex-row items-center gap-1">
              <ThemedText className="text-white">
                <FormattedMessage defaultMessage="New plan" />
              </ThemedText>
              <Icon
                name="plus"
                size={isAndroid ? 22 : 14}
                color="white"
                animationSpec={{ effect: { type: "bounce" } }}
              />
            </TouchableOpacity>
          </Link>
        }
        headerRightElement={
          <Link href="/plan/create" asChild>
            <TouchableOpacity className="ml-auto pb-1 pr-4">
              <Icon name="plus" size={isAndroid ? 24 : 16} />
            </TouchableOpacity>
          </Link>
        }
        height={150}
      >
        <View className="mb-6 flex-row gap-1 px-6">
          {statuses.map(({ type, name }) => {
            const isSelected = status === type;

            return (
              <Pressable
                className={twMerge(
                  "rounded-lg py-2 px-2.5 mr-1 disabled:opacity-50",
                  isSelected ? "bg-primary" : "bg-border",
                )}
                onPress={() => {
                  setStatus(type);
                }}
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
        <View className="gap-3 px-6">
          {isPendingPlans && (
            <>
              <PlanItemListSkeleton />
              <PlanItemListSkeleton />
              <PlanItemListSkeleton />
              <PlanItemListSkeleton />
              <PlanItemListSkeleton />
              <PlanItemListSkeleton />
            </>
          )}
          {!isPendingPlans && !data?.data?.message?.length && (
            <ThemedText>
              <FormattedMessage defaultMessage="No plans found for given status." />
            </ThemedText>
          )}
          {data?.data?.message?.map(
            ({ id, title, status, startDate, mountains, users }) => (
              <PlanItemList
                key={id}
                id={id}
                title={title}
                status={status}
                startDate={startDate}
                mountains={mountains?.map(({ imageUrl }) => ({ imageUrl }))}
                users={users}
              />
            ),
          )}
        </View>
      </ParallaxScrollView>
      {showAlert && <FloatingAlert onClose={() => setShowAlert(false)} />}
    </>
  );
}
