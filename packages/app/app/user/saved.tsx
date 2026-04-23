import { Link, Redirect } from "expo-router";
import { Bookmark } from "lucide-react-native";
import { memo, useCallback } from "react";
import { FormattedMessage } from "react-intl";
import { FlatList, Image, TouchableOpacity, View } from "react-native";

import {
  LucideIcon,
  Skeleton,
  ThemedText,
  ThemedView,
} from "@/components/ui/atoms";
import { ScreenHeader } from "@/components/ui/molecules";
import { useSavedGet, type SavedMountain } from "@/domains/saved/saved.api";
import { useUserMe } from "@/domains/user/user.api";

const keyExtractor = ({ mountainId }: { mountainId: string }) => mountainId;

const SavedRow = memo(function SavedRow({
  slug,
  name,
  location,
  height,
  imageUrl,
}: SavedMountain) {
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
          <ThemedText className="font-medium" numberOfLines={1}>
            {name}
          </ThemedText>
          <ThemedText className="text-sm text-muted-foreground" numberOfLines={1}>
            {location} · {height}m
          </ThemedText>
        </View>
      </TouchableOpacity>
    </Link>
  );
});

export default function UserSavedScreen() {
  const { data: me } = useUserMe();
  const { data, isPending } = useSavedGet();

  const renderItem = useCallback(
    ({ item }: { item: SavedMountain }) => <SavedRow {...item} />,
    [],
  );

  if (!me) {
    return <Redirect href="/join" />;
  }

  return (
    <ThemedView className="flex-1">
      <ScreenHeader />
      <FlatList
        data={data ?? []}
        initialNumToRender={25}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={
          <View className="px-6 pb-4">
            <ThemedText className="mb-2 text-4xl font-bold">
              <FormattedMessage defaultMessage="My saved" />{" "}
              <ThemedText className="text-lg font-semibold text-muted-foreground">
                {data?.length ?? 0}
              </ThemedText>
            </ThemedText>
          </View>
        }
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
