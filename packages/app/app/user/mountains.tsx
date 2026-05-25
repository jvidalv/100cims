import { Redirect, useRouter } from "expo-router";
import { Star } from "lucide-react-native";
import { useCallback } from "react";
import { FormattedMessage } from "react-intl";
import { FlatList, View } from "react-native";

import { useAuth } from "@/components/providers/auth-provider";
import {
  ActivityIndicator,
  LucideIcon,
  ThemedText,
  ThemedView,
} from "@/components/ui/atoms";
import {
  BLURRED_SCREEN_HEADER_HEIGHT,
  BlurredScreenHeader,
  MountainItemListAsTouchable,
} from "@/components/ui/molecules";
import { useMyMountains } from "@/domains/mountain/mountain.api";
import { MountainWithChallengeCount } from "@/types/mountain";

/**
 * The user's mountains list — the rows formerly inside the Mountains tab on
 * /user/challenges. Standalone screen with the blurred header pattern so the
 * /user/challenges screen can route here from a small "My mountains"
 * ActionRow at the bottom of the challenges list.
 */
export default function UserMountainsScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { data: mountains, isLoading } = useMyMountains();

  const renderMountain = useCallback(
    ({ item }: { item: MountainWithChallengeCount }) => (
      <View className="px-6 py-2">
        <MountainItemListAsTouchable
          onPress={() =>
            router.push({
              pathname: "/mountain/[slug]/edit",
              params: { slug: item.slug },
            })
          }
          name={item.name}
          location={item.location}
          imageUrl={item.imageUrl}
          essential={item.essential}
          latitude={item.latitude}
          longitude={item.longitude}
          slug={item.slug}
          height={item.height}
        />
      </View>
    ),
    [router],
  );

  if (!isAuthenticated) {
    return <Redirect href="/join" />;
  }

  return (
    <ThemedView className="flex-1">
      <BlurredScreenHeader>
        <ThemedText numberOfLines={1} className="text-lg font-medium">
          <FormattedMessage
            defaultMessage="My mountains ({count})"
            values={{ count: mountains?.length ?? 0 }}
          />
        </ThemedText>
      </BlurredScreenHeader>

      {isLoading ? (
        <View
          className="flex-1 items-center justify-center"
          style={{ paddingTop: BLURRED_SCREEN_HEADER_HEIGHT }}
        >
          <ActivityIndicator />
        </View>
      ) : !mountains?.length ? (
        <View
          className="px-6"
          style={{ paddingTop: BLURRED_SCREEN_HEADER_HEIGHT }}
        >
          <View className="relative rounded border-2 border-border p-4">
            <View className="absolute right-2 top-2">
              <LucideIcon icon={Star} color="gold" size={24} />
            </View>
            <ThemedText className="mb-1 font-semibold">
              <FormattedMessage defaultMessage="Do you know?" />
            </ThemedText>
            <ThemedText>
              <FormattedMessage defaultMessage="No mountains yet. Create mountains when adding them to a challenge." />
            </ThemedText>
          </View>
        </View>
      ) : (
        <FlatList
          data={mountains}
          keyExtractor={(item) => item.id}
          renderItem={renderMountain}
          contentContainerStyle={{
            paddingTop: BLURRED_SCREEN_HEADER_HEIGHT,
            paddingBottom: 112,
          }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ThemedView>
  );
}
