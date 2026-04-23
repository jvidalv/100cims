import { Link, useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import { useEffect, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  ActivityIndicator,
  View,
  Pressable,
  TouchableOpacity,
} from "react-native";
import Animated from "react-native-reanimated";
import { twMerge } from "tailwind-merge";


import { useAuth } from "@/components/providers/auth-provider";
import { ThemedText, ThemedView } from "@/components/ui/atoms";
import {
  ActionRow,
  PushPermissionDialog,
  ScreenHeader,
} from "@/components/ui/molecules";
import {
  PlanItemList,
  PlanItemListSkeleton,
} from "@/components/ui/molecules/plan-item-list";
import {
  type PlanStatus,
  useMarkPlansAsVisited,
  usePlansInfinite,
} from "@/domains/plan/plan.api";
import { useAskPushPermission } from "@/hooks/use-ask-push-permission";

export default function PlansScreen() {
  const intl = useIntl();
  const router = useRouter();
  const [status, setStatus] = useState<PlanStatus>("open");
  const { isAuthenticated } = useAuth();
  const {
    isOpen: isPushPromptOpen,
    ask: askPushPermission,
    dismiss: dismissPushPrompt,
    confirm: confirmPushPrompt,
  } = useAskPushPermission();
  const { mutate: markAsVisited } = useMarkPlansAsVisited();
  const {
    data,
    isPending: isPendingPlans,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = usePlansInfinite({ status });

  useEffect(() => {
    if (!isAuthenticated) return;
    void askPushPermission();
  }, [isAuthenticated, askPushPermission]);

  useEffect(() => {
    if (isAuthenticated) {
      markAsVisited();
    }
  }, [isAuthenticated, markAsVisited]);

  const statuses: { type: PlanStatus; name: string }[] = [
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
            <ThemedText className="mb-2 text-4xl font-bold">
              <FormattedMessage defaultMessage="All plans" />
            </ThemedText>
            <View className="flex-row gap-1">
              {statuses.map(({ type, name }) => {
                const isSelected = status === type;
                return (
                  <Pressable
                    className={twMerge(
                      "rounded py-2 px-2.5 mr-1 disabled:opacity-50",
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
            <ActionRow
              icon={Plus}
              size="lg"
              intent="primary"
              className="mt-3"
              onPress={() => router.push("/plan/create")}
            >
              <FormattedMessage defaultMessage="New plan" />
            </ActionRow>
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
