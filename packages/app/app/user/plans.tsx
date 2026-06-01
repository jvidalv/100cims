import { useRouter } from "expo-router";
import { Plus, Star } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { twMerge } from "tailwind-merge";

import {
  LucideIcon,
  SearchInput,
  ThemedText,
  ThemedView,
} from "@/components/ui/atoms";
import {
  ActionRow,
  BlurredScreenHeader,
  useBlurredScreenHeaderHeight,
} from "@/components/ui/molecules";
import {
  PlanItemList,
  PlanItemListSkeleton,
} from "@/components/ui/molecules/plan-item-list";
import { type PlanStatus, usePlans } from "@/domains/plan/plan.api";
import { useUserMe } from "@/domains/user/user.api";
import { cleanText } from "@/lib";

export default function UserPlansScreen() {
  const intl = useIntl();
  const router = useRouter();
  const blurredHeaderHeight = useBlurredScreenHeaderHeight();
  const { data: me } = useUserMe();

  const [status, setStatus] = useState<PlanStatus>("open");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  // Always sort upcoming-first (chronological for open plans; for completed/
  // canceled the order is the API default). A user-facing sort picker was
  // considered, but with only "upcoming" available it was a single always-
  // selected chip — dead chrome rather than a real control.
  const { data, isPending: isPendingPlans } = usePlans(
    { userId: me?.id, status, sort: "upcoming" },
    { enabled: !!me?.id },
  );

  // Client-side title search — the /plans/all endpoint doesn't take a `q`
  // param, but the user's own plan list is small enough that filtering on
  // the device is instant. Matches the `cleanText` (case + accent
  // insensitive) helper /mountains uses.
  const visiblePlans = useMemo(() => {
    if (!data) return data;
    const q = cleanText(debouncedSearch.trim()).toLowerCase();
    if (!q) return data;
    return data.filter((p) => cleanText(p.title).toLowerCase().includes(q));
  }, [data, debouncedSearch]);

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

  const isEmpty = !isPendingPlans && (visiblePlans?.length ?? 0) === 0;
  const isFiltering = debouncedSearch.length > 0;

  return (
    <ThemedView className="flex-1">
      <BlurredScreenHeader>
        <ThemedText numberOfLines={1} className="text-lg font-medium">
          <FormattedMessage defaultMessage="My plans" />
        </ThemedText>
      </BlurredScreenHeader>

      {/* Fixed filter header: search + status pills. Mirrors the
          /user/summits layout. Padding-top clears the BlurredScreenHeader. */}
      <View
        className="gap-3 px-6 pb-3"
        style={{ paddingTop: blurredHeaderHeight }}
      >
        <SearchInput onChangeText={setSearchInput} />

        <View className="flex-row flex-wrap gap-2">
          {statuses.map(({ type: pillStatus, name }) => {
            const selected = status === pillStatus;
            return (
              <TouchableOpacity
                key={pillStatus}
                onPress={() => setStatus(pillStatus)}
                className={twMerge(
                  "rounded-full border-2 px-3 py-1.5",
                  selected ? "border-primary bg-primary/10" : "border-border",
                )}
              >
                <ThemedText
                  className={twMerge(
                    "text-sm font-medium",
                    selected ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {name}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>

      </View>

      {/* Scroll body: list of plans, then the "New plan" CTA at the bottom
          — mirrors /user/challenges so the create affordance lives below
          the user's existing items rather than competing with them above. */}
      <ScrollView className="flex-1">
        {isPendingPlans && (
          <View className="gap-3 px-6 pb-4">
            <PlanItemListSkeleton />
            <PlanItemListSkeleton />
            <PlanItemListSkeleton />
            <PlanItemListSkeleton />
          </View>
        )}

        {isEmpty && !isFiltering && (
          <View className="px-6 pb-4">
            <View className="relative rounded border-2 border-border p-4">
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
          </View>
        )}

        {isEmpty && isFiltering && (
          <View className="px-6 pb-4">
            <ThemedText className="text-muted-foreground">
              <FormattedMessage defaultMessage="No plans match your search." />
            </ThemedText>
          </View>
        )}

        <View className="gap-3 px-6 pb-28">
          {visiblePlans?.map(
            ({
              id,
              title,
              imageUrl,
              status: planStatus,
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
                status={planStatus}
                type={type}
                startDate={startDate}
                isPrivate={isPrivate}
                mountains={mountains?.map(({ imageUrl }) => ({ imageUrl }))}
                users={users}
              />
            ),
          )}
          <View className="mt-4">
            <ActionRow
              icon={Plus}
              onPress={() => router.push("/plans/create")}
            >
              <FormattedMessage defaultMessage="New plan" />
            </ActionRow>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}
