import { Link, Redirect } from "expo-router";
import { Bookmark } from "lucide-react-native";
import { memo, useCallback, useMemo } from "react";
import { FormattedMessage } from "react-intl";
import { FlatList, Image, TouchableOpacity, View } from "react-native";
import { twMerge } from "tailwind-merge";

import {
  LucideIcon,
  Skeleton,
  ThemedText,
  ThemedView,
} from "@/components/ui/atoms";
import {
  BLURRED_SCREEN_HEADER_HEIGHT,
  BlurredScreenHeader,
} from "@/components/ui/molecules";
import { useSavedGet, type SavedMountain } from "@/domains/saved/saved.api";
import { useUserChallengeSummits, useUserMe } from "@/domains/user/user.api";

const keyExtractor = ({ mountainId }: { mountainId: string }) => mountainId;

type SavedRowProps = SavedMountain & { isSummited: boolean };

const SavedRow = memo(function SavedRow({
  slug,
  name,
  location,
  height,
  essential,
  imageUrl,
  isSummited,
}: SavedRowProps) {
  return (
    <Link
      href={{
        pathname: "/mountain/[slug]",
        params: { slug },
      }}
      asChild
    >
      <TouchableOpacity className="mx-6 flex-row items-center gap-3 py-2">
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl, cache: "force-cache" }}
            className="size-10 rounded bg-gray-400 dark:bg-gray-500"
          />
        ) : (
          <View className="size-10 rounded bg-gray-400 dark:bg-gray-500" />
        )}
        <View className="flex-1">
          <ThemedText
            className={twMerge(
              "font-medium",
              isSummited && "text-emerald-600 dark:text-emerald-400",
            )}
            numberOfLines={1}
          >
            {name}
          </ThemedText>
          <ThemedText className="text-sm" numberOfLines={1}>
            <ThemedText className="text-sm text-muted-foreground">
              {location} ·{" "}
            </ThemedText>
            <ThemedText
              className={twMerge(
                "text-sm font-medium",
                essential ? "text-primary" : "text-muted-foreground",
              )}
            >
              {height}m
            </ThemedText>
          </ThemedText>
        </View>
      </TouchableOpacity>
    </Link>
  );
});

export default function UserSavedScreen() {
  const { data: me } = useUserMe();
  const { data, isPending } = useSavedGet();
  const { data: userSummits } = useUserChallengeSummits();

  const summitedSlugs = useMemo(
    () => new Set((userSummits?.summits ?? []).map((s) => s.mountainSlug)),
    [userSummits],
  );

  const renderItem = useCallback(
    ({ item }: { item: SavedMountain }) => (
      <SavedRow {...item} isSummited={summitedSlugs.has(item.slug)} />
    ),
    [summitedSlugs],
  );

  if (!me) {
    return <Redirect href="/join" />;
  }

  return (
    <ThemedView className="flex-1">
      <BlurredScreenHeader>
        <ThemedText numberOfLines={1} className="text-lg font-medium">
          <FormattedMessage
            defaultMessage="My saved mountains ({count})"
            values={{ count: data?.length ?? 0 }}
          />
        </ThemedText>
      </BlurredScreenHeader>
      <FlatList
        data={data ?? []}
        initialNumToRender={25}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={{ paddingTop: BLURRED_SCREEN_HEADER_HEIGHT }}
        ListEmptyComponent={
          isPending ? (
            <View className="px-6">
              <View className="flex-row items-center gap-3 py-2">
                <Skeleton className="size-10 rounded" />
                <View className="gap-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                </View>
              </View>
            </View>
          ) : (
            <View className="items-center gap-3 px-6 pt-8">
              <LucideIcon icon={Bookmark} size={32} muted />
              <ThemedText className="text-center text-muted-foreground">
                <FormattedMessage defaultMessage="Tap the bookmark on any mountain to save it here." />
              </ThemedText>
            </View>
          )
        }
      />
    </ThemedView>
  );
}
