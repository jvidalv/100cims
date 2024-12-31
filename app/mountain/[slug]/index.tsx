import { format } from "date-fns/format";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { Link, useLocalSearchParams } from "expo-router";
import { TouchableOpacity, View } from "react-native";

import { ThemedText, Icon, Button } from "@/components/ui/atoms";
import { AvatarGroup } from "@/components/ui/molecules";
import ParallaxScrollView from "@/components/ui/organisms/parallax-scroll-view";
import { useMountains } from "@/domains/mountain/mountain.api";
import { useSummitsGet } from "@/domains/summit/summit.api";
import { getFullName } from "@/domains/user/user.utils";

export default function MountainScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const { data: mountains } = useMountains();

  const mountain = mountains?.data?.message?.find(
    (mountain) => slug === mountain.slug,
  );

  const { data: latestSummits } = useSummitsGet({
    limit: 50,
    mountainId: mountain?.id,
  });

  if (!mountain) {
    return null;
  }

  return (
    <ParallaxScrollView
      title={mountain.name}
      headerClassName="flex items-center justify-center bg-primary"
      contentClassName="gap-12 px-6 py-6"
      headerImage={
        <Image
          source={mountain.imageUrl}
          placeholder={{ blurhash: `L~I64nWEWXaz_NWEWWazbvWBaxfQ` }}
          style={{ flex: 1, width: "100%" }}
          contentFit="cover"
          contentPosition="center"
          transition={500}
        />
      }
    >
      <View className="gap-4">
        <View className="flex-row gap-4">
          <View className="flex-row gap-2">
            <Icon name="mountain.2.fill" muted />
            <ThemedText className="text-xl font-medium">
              {mountain.height}m
            </ThemedText>
          </View>
          {mountain.essential && (
            <View className="flex-row items-center gap-2">
              <View className="size-4 rounded-full bg-primary" />
              <ThemedText className="text-xl font-medium">Essential</ThemedText>
            </View>
          )}
        </View>
        <View className="flex-row gap-2">
          <Icon name="map.circle.fill" muted />
          <ThemedText className="text-xl font-medium">
            {mountain.location}
          </ThemedText>
        </View>
      </View>
      <View className="gap-4">
        <ThemedText className="text-2xl font-semibold">View</ThemedText>
        <View className="flex-row gap-4">
          <TouchableOpacity
            onPress={() =>
              Linking.openURL(
                `https://www.google.es/maps?q=${mountain.latitude},${mountain.longitude}`,
              )
            }
            className="flex-1 flex-row items-center justify-between rounded-xl border-2 border-border p-4"
          >
            <ThemedText className="text-xl font-medium">
              On{" "}
              <ThemedText className="text-xl font-medium text-blue-500">
                maps
              </ThemedText>
            </ThemedText>
            <Icon name="arrow.right" muted size={20} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              Linking.openURL(
                `https://es.wikiloc.com/wikiloc/map.do?q=100cims ${mountain.name}&fitMapToTrails=1&page=1`,
              )
            }
            className="flex-1 flex-row items-center justify-between rounded-xl border-2 border-border p-4"
          >
            <ThemedText className="text-xl font-medium">
              On{" "}
              <ThemedText
                className="text-xl font-medium"
                style={{ color: "#4b8c2a" }}
              >
                wikiloc
              </ThemedText>
            </ThemedText>
            <Icon name="arrow.right" muted size={20} />
          </TouchableOpacity>
        </View>
      </View>
      <View className="gap-4">
        <ThemedText className="text-2xl font-semibold">Actions</ThemedText>
        <Link
          href={{ pathname: "/mountain/[slug]/summit", params: { slug } }}
          asChild
        >
          <Button className="flex-1">Summit</Button>
        </Link>
        <View className="flex flex-row items-center gap-1">
          <ThemedText className="text-lg font-semibold text-emerald-500">
            You summited this mountain
          </ThemedText>
          <Icon name="checkmark.seal.fill" color="#10b981" size={20} />
        </View>
      </View>
      <View className="mb-32 gap-4">
        <ThemedText className="text-2xl font-semibold">All summits</ThemedText>
        <View className="gap-3">
          {latestSummits?.data?.message?.map(
            ({ summitId, summitedAt, users }) => {
              const firstName = users[0]?.firstName;
              const firstNameSecond = users[1]?.firstName;

              return (
                <View
                  key={summitId}
                  className="flex-row items-end justify-between gap-4"
                >
                  <View>
                    <ThemedText className="font-black">
                      <ThemedText className="font-medium">
                        {firstName}
                      </ThemedText>
                      {users.length >= 2 && (
                        <ThemedText className="font-medium">
                          {users.length === 2 ? (
                            <ThemedText className="text-muted-foreground">
                              {" "}
                              &
                            </ThemedText>
                          ) : (
                            ","
                          )}{" "}
                          {firstNameSecond}
                        </ThemedText>
                      )}
                      {users.length > 2 && (
                        <ThemedText className="text-muted-foreground">
                          {" "}
                          & {users.length - 2} more
                        </ThemedText>
                      )}
                    </ThemedText>
                    <ThemedText className="text-sm text-muted-foreground">
                      {format(summitedAt, "dd MMM yyyy")}
                    </ThemedText>
                  </View>
                  <AvatarGroup
                    size="sm"
                    items={users.map((user) => ({
                      name: getFullName(user),
                      imageUrl: user.imageUrl,
                    }))}
                  />
                </View>
              );
            },
          )}
        </View>
      </View>
    </ParallaxScrollView>
  );
}
