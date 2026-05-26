import { Link } from "expo-router";
import { Backpack, CalendarDays, MapPin } from "lucide-react-native";
import { useEffect, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";
import Animated from "react-native-reanimated";
import { twMerge } from "tailwind-merge";

import { useAuth } from "@/components/providers/auth-provider";
import { LucideIcon, ThemedText, ThemedView } from "@/components/ui/atoms";
import {
  BlurredScreenHeader,
  BLURRED_SCREEN_HEADER_HEIGHT,
  PushPermissionDialog,
} from "@/components/ui/molecules";
import {
  PlanItemList,
  PlanItemListSkeleton,
} from "@/components/ui/molecules/plan-item-list";
import { useMountains } from "@/domains/mountain/mountain.api";
import {
  useMarkPlansAsVisited,
  usePlansInfinite,
} from "@/domains/plan/plan.api";
import { useUserMe } from "@/domains/user/user.api";
import { useAskPushPermission } from "@/hooks/use-ask-push-permission";
import { useLocation } from "@/hooks/use-location";
import { getDistanceInKm } from "@/lib/location";

type Filter = "coming-soon" | "closer" | "mine";

// Plans without any mountains can't be distance-ranked. We push them to the
// end with this sentinel rather than excluding them, since the user asked
// for "non mountains one can go last".
const NO_MOUNTAIN_DISTANCE = Number.POSITIVE_INFINITY;

export default function PlansScreen() {
  const intl = useIntl();
  const { isAuthenticated } = useAuth();
  const { data: user } = useUserMe();
  const [filter, setFilter] = useState<Filter>("coming-soon");

  const {
    isOpen: isPushPromptOpen,
    ask: askPushPermission,
    dismiss: dismissPushPrompt,
    confirm: confirmPushPrompt,
  } = useAskPushPermission();
  const { mutate: markAsVisited } = useMarkPlansAsVisited();

  // Only "open" plans show on this tab. "Mine" narrows the API query to
  // plans where the user participates (created or joined). React Compiler
  // memoizes this — no useMemo needed.
  const apiQuery: { status: "open"; userId?: string } =
    filter === "mine" && user?.id
      ? { status: "open", userId: user.id }
      : { status: "open" };
  const {
    data,
    isPending: isPendingPlans,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = usePlansInfinite(apiQuery);

  // Only request location permission when the user actually picks Closer.
  // The hook reads current permission state otherwise (no prompt).
  const { location: userLocation } = useLocation({
    prompt: filter === "closer",
  });
  // Mountain catalog is cached at app root (10h staleTime); we just read it.
  const { data: allMountains } = useMountains();

  useEffect(() => {
    if (!isAuthenticated) return;
    void askPushPermission();
  }, [isAuthenticated, askPushPermission]);

  useEffect(() => {
    if (isAuthenticated) {
      markAsVisited();
    }
  }, [isAuthenticated, markAsVisited]);

  const rawPlans = data?.pages.flatMap((p) => p.items) ?? [];

  // Closer filter: client-side sort by distance from user to the closest
  // mountain in each plan. Falls back to API order if we don't have user
  // coordinates yet (permission denied or still loading). React Compiler
  // memoizes this transformation automatically.
  const plans = (() => {
    if (filter !== "closer" || !userLocation?.coords || !allMountains) {
      return rawPlans;
    }
    const mountainById = new Map(allMountains.map((m) => [m.id, m]));
    const distanceOf = (plan: (typeof rawPlans)[number]): number => {
      const ds = plan.mountains
        .map((m) => mountainById.get(m.id))
        .filter((m): m is NonNullable<typeof m> => !!m)
        .map((m) =>
          getDistanceInKm(userLocation.coords, {
            latitude: parseFloat(m.latitude),
            longitude: parseFloat(m.longitude),
          }),
        );
      return ds.length === 0 ? NO_MOUNTAIN_DISTANCE : Math.min(...ds);
    };
    return [...rawPlans].sort((a, b) => distanceOf(a) - distanceOf(b));
  })();

  const filters: { value: Filter; label: string; icon: typeof CalendarDays }[] =
    [
      {
        value: "coming-soon",
        label: intl.formatMessage({ defaultMessage: "Coming soon" }),
        icon: CalendarDays,
      },
      {
        value: "closer",
        label: intl.formatMessage({ defaultMessage: "Closer" }),
        icon: MapPin,
      },
      {
        value: "mine",
        label: intl.formatMessage({ defaultMessage: "My plans" }),
        icon: Backpack,
      },
    ];

  return (
    <ThemedView className="flex-1">
      <BlurredScreenHeader>
        <ThemedText numberOfLines={1} className="max-w-56 text-lg font-medium">
          {intl.formatMessage({ defaultMessage: "Plans" })}
        </ThemedText>
      </BlurredScreenHeader>
      <Animated.FlatList
        data={plans}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingTop: BLURRED_SCREEN_HEADER_HEIGHT,
          paddingHorizontal: 24,
          gap: 12,
        }}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            void fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <View className="flex-row gap-2 pb-2">
            {filters.map((option) => {
              const selected = filter === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => setFilter(option.value)}
                  className={twMerge(
                    "flex-row items-center gap-1.5 rounded-full border-2 px-3 py-1.5",
                    selected
                      ? "border-primary bg-primary/10"
                      : "border-border",
                  )}
                >
                  <LucideIcon
                    icon={option.icon}
                    size={14}
                    muted={!selected}
                    primary={selected}
                  />
                  <ThemedText
                    className={twMerge(
                      "text-sm font-medium",
                      selected ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {option.label}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
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
          ) : (
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
            imageUrl={item.imageUrl}
            status={item.status}
            type={item.type}
            startDate={item.startDate}
            isPrivate={item.isPrivate}
            mountains={item.mountains?.map(({ imageUrl }) => ({ imageUrl }))}
            users={item.users}
          />
        )}
      />
      <PushPermissionDialog
        isOpen={isPushPromptOpen}
        onClose={dismissPushPrompt}
        onEnable={confirmPushPrompt}
      />
    </ThemedView>
  );
}
