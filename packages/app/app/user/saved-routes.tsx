import { Link, Redirect } from "expo-router";
import { Bookmark, Route as RouteIcon } from "lucide-react-native";
import { memo, useCallback } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { FlatList, TouchableOpacity, View } from "react-native";

import {
  LucideIcon,
  Skeleton,
  ThemedText,
  ThemedView,
} from "@/components/ui/atoms";
import { Image } from "@/components/ui/atoms/image";
import {
  useBlurredScreenHeaderHeight,
  BlurredScreenHeader,
} from "@/components/ui/molecules";
import {
  formatKm,
  formatMeters,
  pickLocalizedString,
} from "@/domains/route/route.format";
import {
  useSavedRoutesGet,
  type SavedRoute,
} from "@/domains/saved/saved-routes.api";
import { useUserMe } from "@/domains/user/user.api";

const keyExtractor = ({ routeId }: { routeId: string }) => routeId;

const SavedRouteRow = memo(function SavedRouteRow({
  routeId,
  externalId,
  title,
  distanceMeters,
  elevationGainMeters,
  mountainSlug,
  mountainName,
  mountainImageUrl,
}: SavedRoute) {
  const intl = useIntl();
  const titleText = pickLocalizedString(title, intl, externalId);

  // Without a mountain attribution we can't deep-link to the route's
  // mountain-scoped detail screen, so the row becomes non-tappable.
  // Saved routes without a primary mountain are rare; this avoids a
  // dead-end href.
  if (!mountainSlug) {
    return (
      <View className="mx-6 flex-row items-center gap-3 py-2">
        <View className="size-10 items-center justify-center rounded bg-gray-400 dark:bg-gray-500">
          <LucideIcon icon={RouteIcon} size={20} muted />
        </View>
        <View className="flex-1">
          <ThemedText className="font-medium" numberOfLines={1}>
            {titleText}
          </ThemedText>
          <ThemedText
            className="text-sm text-muted-foreground"
            numberOfLines={1}
          >
            {distanceMeters !== null ? formatKm(distanceMeters) : "—"}
            {elevationGainMeters !== null
              ? ` · ${formatMeters(elevationGainMeters)}`
              : ""}
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <Link
      href={{
        pathname: "/mountain/[slug]/routes/[routeId]",
        params: { slug: mountainSlug, routeId },
      }}
      asChild
    >
      <TouchableOpacity className="mx-6 flex-row items-center gap-3 py-2">
        {mountainImageUrl ? (
          <Image
            source={{ uri: mountainImageUrl, cache: "force-cache" }}
            className="size-10 rounded bg-gray-400 dark:bg-gray-500"
          />
        ) : (
          <View className="size-10 rounded bg-gray-400 dark:bg-gray-500" />
        )}
        <View className="flex-1">
          <ThemedText className="font-medium" numberOfLines={1}>
            {titleText}
          </ThemedText>
          <ThemedText className="text-sm" numberOfLines={1}>
            <ThemedText className="text-sm text-muted-foreground">
              {mountainName ?? "—"}
              {distanceMeters !== null ? ` · ${formatKm(distanceMeters)}` : ""}
              {elevationGainMeters !== null
                ? ` · ${formatMeters(elevationGainMeters)}`
                : ""}
            </ThemedText>
          </ThemedText>
        </View>
      </TouchableOpacity>
    </Link>
  );
});

export default function UserSavedRoutesScreen() {
  const blurredHeaderHeight = useBlurredScreenHeaderHeight();
  const { data: me } = useUserMe();
  const { data, isPending } = useSavedRoutesGet();

  const renderItem = useCallback(
    ({ item }: { item: SavedRoute }) => <SavedRouteRow {...item} />,
    [],
  );

  if (!me) {
    return <Redirect href="/join" />;
  }

  return (
    <ThemedView className="flex-1">
      <BlurredScreenHeader>
        <ThemedText numberOfLines={1} className="text-lg font-medium">
          <FormattedMessage
            defaultMessage="Saved routes ({count})"
            values={{ count: data?.length ?? 0 }}
          />
        </ThemedText>
      </BlurredScreenHeader>
      <FlatList
        data={data ?? []}
        initialNumToRender={25}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={{ paddingTop: blurredHeaderHeight }}
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
                <FormattedMessage defaultMessage="Tap the bookmark on any route to save it here." />
              </ThemedText>
            </View>
          )
        }
      />
    </ThemedView>
  );
}
