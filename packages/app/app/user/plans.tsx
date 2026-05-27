import { useRouter } from "expo-router";
import { Plus, Star } from "lucide-react-native";
import { useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Pressable, ScrollView, View } from "react-native";
import { twMerge } from "tailwind-merge";

import { LucideIcon, ThemedText, ThemedView } from "@/components/ui/atoms";
import {
  ActionRow,
  useBlurredScreenHeaderHeight,
  BlurredScreenHeader,
} from "@/components/ui/molecules";
import {
  PlanItemList,
  PlanItemListSkeleton,
} from "@/components/ui/molecules/plan-item-list";
import { type PlanStatus, usePlans } from "@/domains/plan/plan.api";
import { useUserMe } from "@/domains/user/user.api";

export default function UserPlansScreen() {
  const intl = useIntl();
  const router = useRouter();
  const blurredHeaderHeight = useBlurredScreenHeaderHeight();
  const { data: me } = useUserMe();
  const [status, setStatus] = useState<PlanStatus>("open");
  const { data, isPending: isPendingPlans } = usePlans(
    { userId: me?.id, status },
    { enabled: !!me?.id },
  );

  const statuses: { type: PlanStatus; name: string }[] = [
    { type: "open", name: intl.formatMessage({ defaultMessage: "Open" }) },
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
    <ThemedView className="flex-1">
      <BlurredScreenHeader>
        <ThemedText numberOfLines={1} className="text-lg font-medium">
          <FormattedMessage defaultMessage="My plans" />
        </ThemedText>
      </BlurredScreenHeader>
      <View
        className="mb-4 flex-row gap-1 px-6"
        style={{ paddingTop: blurredHeaderHeight }}
      >
        {statuses.map(({ type: pillStatus, name }) => {
          const isSelected = status === pillStatus;
          return (
            <Pressable
              key={pillStatus}
              onPress={() => setStatus(pillStatus)}
              className={twMerge(
                "rounded py-2 px-2.5 mr-1",
                isSelected ? "bg-primary" : "bg-border",
              )}
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
      <View className="mx-6 mb-4">
        <ActionRow
          icon={Plus}
          size="lg"
          intent="primary"
          onPress={() => router.push("/plans/create")}
        >
          <FormattedMessage defaultMessage="New plan" />
        </ActionRow>
      </View>
      <ScrollView contentContainerClassName="gap-3 px-6 pb-28">
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
        {!isPendingPlans && !data?.length && (
          <View className="relative mt-auto rounded border-2 border-border p-4">
            <View className="absolute right-2 top-2">
              <LucideIcon icon={Star} color="gold" size={24} />
            </View>
            <ThemedText className="mb-1 font-semibold">
              <FormattedMessage defaultMessage="Do you know?" />
            </ThemedText>
            <ThemedText>
              <FormattedMessage defaultMessage="Sharing plans with others is a great way to meet people with similar interests!" />
            </ThemedText>
          </View>
        )}
        {data?.map(
          ({
            id,
            title,
            imageUrl,
            status,
            type,
            startDate,
            isPrivate,
            mountains,
            users,
          }) => (
            <PlanItemList
              key={id}
              id={id}
              title={title}
              imageUrl={imageUrl}
              status={status}
              type={type}
              startDate={startDate}
              isPrivate={isPrivate}
              mountains={mountains?.map(({ imageUrl }) => ({ imageUrl }))}
              users={users}
            />
        ))}
      </ScrollView>
    </ThemedView>
  );
}
