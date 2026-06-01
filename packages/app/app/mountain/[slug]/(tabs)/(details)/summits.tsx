import { useGlobalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { FormattedMessage } from "react-intl";
import { ActivityIndicator, FlatList, View } from "react-native";

import { SummitCard } from "@/components/summit";
import { Skeleton, ThemedText, ThemedView } from "@/components/ui/atoms";
import {
  useBlurredScreenHeaderHeight,
  BlurredScreenHeader,
} from "@/components/ui/molecules";
import { useMountainOne } from "@/domains/mountain/mountain.api";
import { useMountainSummitsAll } from "@/domains/summit/summit.api";

const keyExtractor = ({ summitId }: { summitId: string }) => summitId;

/**
 * All summits for a given mountain, paginated 24-per-page newest-first.
 * Reached via the "All →" link on the mountain Details tab. Lives inside
 * `(tabs)/(details)/` so it pushes onto the Details tab's stack and the
 * mountain tab bar (Details / Summit / Comments) stays visible — same
 * pattern as `app/(tabs)/(home)/summits.tsx`.
 */
export default function MountainAllSummitsScreen() {
  const router = useRouter();
  const blurredHeaderHeight = useBlurredScreenHeaderHeight();
  // useGlobalSearchParams so the parent [slug] resolves on cold-mount
  // through the NativeTabs ancestor — see app skill NativeTabs gotchas.
  const { slug } = useGlobalSearchParams<{ slug: string }>();
  const { data: mountain } = useMountainOne({ mountainSlug: slug });

  const {
    data: summitsPages,
    isPending,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMountainSummitsAll({ mountainId: mountain?.id ?? "" });

  const summits = useMemo(
    () => summitsPages?.pages.flatMap((p) => p.items) ?? [],
    [summitsPages],
  );
  const totalSummits = summitsPages?.pages[0]?.pagination.totalItems ?? 0;

  const handleEndReached = () => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  };

  return (
    <ThemedView className="flex-1">
      <BlurredScreenHeader>
        <ThemedText numberOfLines={1} className="max-w-56 text-lg font-medium">
          {mountain?.name ?? ""}
        </ThemedText>
      </BlurredScreenHeader>
      <FlatList
        data={summits}
        keyExtractor={keyExtractor}
        numColumns={2}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        contentContainerStyle={{
          paddingTop: blurredHeaderHeight,
          paddingHorizontal: 16,
        }}
        ListHeaderComponent={
          <View className="pb-2">
            <ThemedText className="text-2xl font-semibold">
              <FormattedMessage
                defaultMessage="All summits ({count})"
                values={{ count: totalSummits }}
              />
            </ThemedText>
          </View>
        }
        ListEmptyComponent={
          isPending ? (
            <View className="flex-row flex-wrap">
              {Array.from({ length: 4 }).map((_, i) => (
                <View
                  key={i}
                  className={i % 2 === 0 ? "w-1/2 pr-1" : "w-1/2 pl-1"}
                >
                  <Skeleton
                    className="mb-2 w-full"
                    style={{ height: 243, borderRadius: 6 }}
                  />
                </View>
              ))}
            </View>
          ) : (
            <ThemedText className="text-muted-foreground">
              <FormattedMessage defaultMessage="No one summited yet." />
            </ThemedText>
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View className="py-4">
              <ActivityIndicator />
            </View>
          ) : (
            <View className="h-32" />
          )
        }
        renderItem={({ item, index }) => (
          <SummitCard
            summit={item}
            index={index}
            onPress={() =>
              router.push({
                pathname: "/user/summits/[summit]",
                params: { summit: item.summitId },
              })
            }
            onParticipantPress={(userId) => router.push(`/user/${userId}`)}
          />
        )}
      />
    </ThemedView>
  );
}
