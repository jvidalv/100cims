import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FormattedMessage } from "react-intl";
import { View, StyleSheet, TouchableOpacity } from "react-native";

import { Skeleton, ThemedText } from "@/components/ui/atoms";
import { AvatarGroup } from "@/components/ui/molecules";
import ParallaxScrollView from "@/components/ui/organisms/parallax-scroll-view";
import { useAnyUserSummits, useUserOneGet } from "@/domains/user/user.api";
import { getFullName } from "@/domains/user/user.utils";

export default function UserScreen() {
  const router = useRouter();
  const { user: userId } = useLocalSearchParams<{ user: string }>();
  const { data: user } = useUserOneGet({ userId });
  const { data: summits, isPending: isPendingSummits } = useAnyUserSummits({
    userId,
  });

  return (
    <ParallaxScrollView
      title={user?.firstName || "..."}
      headerClassName="flex items-center justify-center bg-primary"
      contentClassName="py-6"
      headerImage={
        user?.imageUrl ? (
          <ExpoImage
            source={user?.imageUrl}
            placeholder={{ blurhash: `L~I64nWEWXaz_NWEWWazbvWBaxfQ` }}
            style={{ flex: 1, width: "100%" }}
            contentFit="cover"
            contentPosition="center"
            transition={500}
          />
        ) : (
          <View className="flex-1 bg-primary" />
        )
      }
    >
      <ThemedText className="mb-4 px-6 text-2xl font-semibold">
        <FormattedMessage defaultMessage="Summits" />
        <ThemedText className="font-medium text-muted-foreground">
          {"  "}
          {summits?.length}
        </ThemedText>
      </ThemedText>
      <View className="flex flex-row flex-wrap">
        {isPendingSummits && (
          <>
            <Skeleton className="h-32 w-1/3 rounded-none" />
            <Skeleton className="h-32 w-1/3 rounded-none border-l border-background" />
            <Skeleton className="h-32 w-1/3 rounded-none border-l border-background" />
            <Skeleton className="h-32 w-1/3 rounded-none border-t border-background" />
            <Skeleton className="h-32 w-1/3 rounded-none border-l border-t border-background" />
            <Skeleton className="h-32 w-1/3 rounded-none border-l border-t border-background" />
            <Skeleton className="h-32 w-1/3 rounded-none border-t border-background" />
            <Skeleton className="h-32 w-1/3 rounded-none border-l border-t border-background" />
            <Skeleton className="h-32 w-1/3 rounded-none border-l border-t border-background" />
          </>
        )}
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
              <ExpoImage
                source={mountainImageUrl}
                placeholder={{ blurhash: `L~I64nWEWXaz_NWEWWazbvWBaxfQ` }}
                style={{ height: "100%", width: "100%" }}
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
      <ThemedText className="mb-4 mt-6 px-6 text-2xl font-semibold">
        <FormattedMessage defaultMessage="Photos" />
      </ThemedText>
      <View className="flex flex-row flex-wrap">
        {isPendingSummits && (
          <>
            <Skeleton className="h-44 w-1/2 rounded-none" />
            <Skeleton className="h-44 w-1/2 rounded-none border-l border-background" />
            <Skeleton className="h-44 w-1/2 rounded-none border-t border-background" />
            <Skeleton className="h-44 w-1/2 rounded-none border-l border-t border-background" />
            <Skeleton className="h-44 w-1/2 rounded-none border-t border-background" />
            <Skeleton className="h-44 w-1/2 rounded-none border-l border-t border-background" />
            <Skeleton className="h-44 w-1/2 rounded-none border-t border-background" />
            <Skeleton className="h-44 w-1/2 rounded-none border-l border-t border-background" />
          </>
        )}
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
            <ExpoImage
              source={summitedImageUrl}
              placeholder={{ blurhash: `L~I64nWEWXaz_NWEWWazbvWBaxfQ` }}
              style={{ height: "100%", width: "100%" }}
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
                  user
                    ? {
                        name: getFullName(user),
                        imageUrl: user.imageUrl,
                      }
                    : { name: "..." },
                ]}
              />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ParallaxScrollView>
  );
}
