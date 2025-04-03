import { Link } from "expo-router";
import { FormattedMessage } from "react-intl";
import { Image, TouchableOpacity, View } from "react-native";

import { Icon, ThemedText } from "@/components/ui/atoms";
import { useUserChallengeSummits } from "@/domains/user/user.api";

interface InternalProps {
  slug: string;
  name: string;
  location: string;
  height: string;
  essential: boolean;
  imageUrl: string | null;
}

export const MountainItemListAsTouchable = ({
  onPress,
  ...props
}: InternalProps & { onPress?: () => void }) => {
  return (
    <TouchableOpacity onPress={onPress} className="flex-row gap-4">
      <MountainItemListCore {...props} />
    </TouchableOpacity>
  );
};

export const MountainItemListCore = ({
  name,
  location,
  height,
  imageUrl,
  essential,
  slug,
}: InternalProps) => {
  const { data: userSummits } = useUserChallengeSummits();

  const isSummited = userSummits?.summits.some(
    ({ mountainSlug }) => slug === mountainSlug,
  );

  return (
    <>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl, cache: "force-cache" }}
          className="items-center justify-center bg-gray-300 dark:bg-gray-800"
          style={{ width: 100, height: 100, borderRadius: 12 }}
        />
      ) : (
        <View
          className="items-center justify-center bg-gray-300 dark:bg-gray-800"
          style={{ width: 100, height: 100, borderRadius: 12 }}
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
          <ThemedText className="font-medium text-muted-foreground">
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
    </>
  );
};

export const MountainItemList = (props: InternalProps) => {
  return (
    <Link
      href={{
        pathname: "/mountain/[slug]",
        params: { slug: props.slug },
      }}
      asChild
    >
      <TouchableOpacity className="flex-row gap-4">
        <MountainItemListCore {...props} />
      </TouchableOpacity>
    </Link>
  );
};
