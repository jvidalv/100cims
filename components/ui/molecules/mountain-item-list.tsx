import { Image } from "expo-image";
import { Link } from "expo-router";
import { FormattedMessage } from "react-intl";
import { TouchableOpacity, View } from "react-native";

import { Icon, ThemedText } from "@/components/ui/atoms";
import { useUserSummits } from "@/domains/user/user.api";

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
  const { data: userSummits } = useUserSummits();

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
        <Image
          source={imageUrl}
          style={{ width: 100, height: 100, borderRadius: 16 }}
          contentFit="cover"
          contentPosition="center"
          placeholder={{ blurhash: `L~I64nWEWXaz_NWEWWazbvWBaxfQ` }}
        />
        <View className="flex-1 justify-center">
          <View className="gap-1">
            {isSummited && (
              <View className="flex-row items-center gap-1">
                <ThemedText className="font-semibold text-emerald-500">
                  Summited
                </ThemedText>
                <Icon name="checkmark.seal.fill" color="#10b981" size={16} />
              </View>
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
                    <FormattedMessage defaultMessage="essential" />{" "}
                    <View className="size-3 rounded-full bg-primary" />
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
