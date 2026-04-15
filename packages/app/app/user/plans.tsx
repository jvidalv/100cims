import { Link } from "expo-router";
import { Plus, Star } from "lucide-react-native";
import { FormattedMessage } from "react-intl";
import { ScrollView, TouchableOpacity, View } from "react-native";


import { LucideIcon, ThemedText, ThemedView } from "@/components/ui/atoms";
import { ScreenHeader } from "@/components/ui/molecules";
import {
  PlanItemList,
  PlanItemListSkeleton,
} from "@/components/ui/molecules/plan-item-list";
import { usePlans } from "@/domains/plan/plan.api";
import { useUserMe } from "@/domains/user/user.api";

export default function UserPlansScreen() {
  const { data: me } = useUserMe();
  const { data, isPending: isPendingPlans } = usePlans(
    { userId: me?.id },
    { enabled: !!me?.id },
  );

  return (
    <ThemedView className="flex-1">
      <ScreenHeader />
      <View className="mb-6 flex-row items-end justify-between px-6">
        <ThemedText className="text-4xl font-bold">
          <FormattedMessage defaultMessage="My plans" />
        </ThemedText>
        <Link href="/plan/create" asChild>
          <TouchableOpacity className="flex-row items-center gap-1">
            <ThemedText>
              <FormattedMessage defaultMessage="New plan" />
            </ThemedText>
            <LucideIcon icon={Plus} size={18} />
          </TouchableOpacity>
        </Link>
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
        {data?.map(({ id, title, status, startDate, mountains, users }) => (
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
      </ScrollView>
    </ThemedView>
  );
}
