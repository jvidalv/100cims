import { Link } from "expo-router";
import { FormattedMessage } from "react-intl";
import { Image, TouchableOpacity, View } from "react-native";

import { Icon, ThemedText } from "@/components/ui/atoms";
import { useUserChallengeSummits } from "@/domains/user/user.api";

export const MountainItemList = ({
  slug,
  name,
  location,
  height,
  imageUrl,
  essential,
}: {
  slug: string;
  name: string;
  location: string;
  height: string;
  essential: boolean;
  imageUrl: string | null;
}) => {
  const { data: userSummits } = useUserChallengeSummits();

  const isSummited = userSummits?.summits.some(
    ({ mountainSlug }) => slug === mountainSlug,
  );

  return (
    <Link
      href={{
        pathname: "/mountain/[slug]",
        params: { slug },
      }}
      asChild
    >
      <TouchableOpacity className="flex-row gap-4">
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            className="items-center justify-center bg-gray-500"
            style={{ width: 100, height: 100, borderRadius: 16 }}
          />
        ) : (
          <View
            className="items-center justify-center bg-gray-500"
            style={{ width: 100, height: 100, borderRadius: 16 }}
          >
            <Icon name="camera" color="white" muted size={32} />
          </View>
        )}
        <View className="flex-1 justify-center">
          <View className="gap-1">
            {isSummited && (
              <ThemedText className="font-semibold text-emerald-500">
                <FormattedMessage defaultMessage="Summited" />
              </ThemedText>
            )}
            <ThemedText className="text-lg font-semibold tracking-tight">
              {name}
            </ThemedText>
            <ThemedText className="-mt-1  font-medium text-muted-foreground">
              {location}
            </ThemedText>
          </View>
          <View className="mt-2">
            <ThemedText className="font-semibold">
              {height}m
              {essential && (
                <ThemedText className="text-muted-foreground">
                  ,{" "}
                  <ThemedText className="font-semibold text-primary">
                    <FormattedMessage defaultMessage="essential" />
                  </ThemedText>
                </ThemedText>
              )}
            </ThemedText>
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  );
};
