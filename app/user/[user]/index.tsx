import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FormattedMessage } from "react-intl";
import { View, Image, StyleSheet, TouchableOpacity } from "react-native";

import { Skeleton, ThemedText, ThemedView } from "@/components/ui/atoms";
import { AvatarGroup } from "@/components/ui/molecules";
import ParallaxScrollView from "@/components/ui/organisms/parallax-scroll-view";
import { useAnyUserSummits, useUserOneGet } from "@/domains/user/user.api";
import { getFullName } from "@/domains/user/user.utils";

export default function MountainScreen() {
  const router = useRouter();
  const { user: userId } = useLocalSearchParams<{ user: string }>();
  const { data: user, isPending: isPendingUser } = useUserOneGet({ userId });
  const { data: summits, isPending: isPendingSummits } = useAnyUserSummits({
    userId,
  });

  if (!user || isPendingUser || isPendingSummits) {
    return (
      <ThemedView className="flex-1">
        <Skeleton className="mb-6 h-[300px] w-full" />
        <ThemedText className="mb-4 px-6 text-2xl font-semibold">
          <FormattedMessage defaultMessage="Summits" />
        </ThemedText>
        <Skeleton className="mx-6 h-32 w-1/3" />
      </ThemedView>
    );
  }

  return (
    <ParallaxScrollView
      title={user.firstName || "..."}
      headerClassName="flex items-center justify-center bg-primary"
      contentClassName="px-6 py-6"
      headerImage={
        <ExpoImage
          source={user.imageUrl}
          placeholder={{ blurhash: `L~I64nWEWXaz_NWEWWazbvWBaxfQ` }}
          style={{ flex: 1, width: "100%" }}
          contentFit="cover"
          contentPosition="center"
          transition={500}
        />
      }
    >
      <ThemedText className="mb-4 text-2xl font-semibold">
        <FormattedMessage defaultMessage="Summits" />
        <ThemedText className="font-medium text-muted-foreground">
          {"  "}
          {summits?.length}
        </ThemedText>
      </ThemedText>
      <View className="flex flex-row flex-wrap overflow-hidden rounded-lg">
        {!summits?.length && !isPendingSummits && (
          <ThemedText className="text-muted-foreground">
            <FormattedMessage defaultMessage="No summits yet." />
          </ThemedText>
        )}
        {summits?.map(
          ({ summitId, mountainSlug, mountainImageUrl, mountainHeight }) => (
            <TouchableOpacity
              key={summitId}
              onPress={() =>
                router.push({
                  pathname: "/mountain/[slug]",
                  params: { slug: mountainSlug },
                })
              }
              className="relative h-32 w-1/3"
            >
              <Image
                source={{ uri: mountainImageUrl! }}
                className="size-full flex-1"
              />
              <View className="absolute size-full">
                <LinearGradient
                  colors={["transparent", "transparent", "rgba(0,0,0,0.6)"]}
                  style={StyleSheet.absoluteFill}
                />
              </View>
              <ThemedText className="absolute bottom-2 pl-2 text-xl font-bold text-white">
                {mountainHeight}m
              </ThemedText>
            </TouchableOpacity>
          ),
        )}
      </View>
      <ThemedText className="mb-4 mt-6 text-2xl font-semibold">
        <FormattedMessage defaultMessage="Photos" />
      </ThemedText>
      <View className="flex flex-row flex-wrap overflow-hidden rounded-lg">
        {!summits?.length && !isPendingSummits && (
          <ThemedText className="text-muted-foreground">
            <FormattedMessage defaultMessage="No photos yet." />
          </ThemedText>
        )}
        {summits?.map(({ summitId, summitedImageUrl, participants }) => (
          <TouchableOpacity
            key={summitId}
            onPress={() =>
              router.push({
                pathname: "/user/summits/[summit]",
                params: { summit: summitId },
              })
            }
            className="relative h-44 w-1/2"
          >
            <Image
              source={{ uri: summitedImageUrl }}
              className="size-full flex-1"
            />
            <View className="absolute size-full">
              <LinearGradient
                colors={["transparent", "transparent", "rgba(0,0,0,0.3)"]}
                style={StyleSheet.absoluteFill}
              />
            </View>
            <View className="absolute bottom-2 pl-2">
              <AvatarGroup
                size="sm"
                items={[
                  ...participants?.map((participant) => ({
                    name: getFullName(participant),
                    imageUrl: participant.imageUrl,
                  })),
                  {
                    name: getFullName(user),
                    imageUrl: user.imageUrl,
                  },
                ]}
              />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ParallaxScrollView>
  );
}
