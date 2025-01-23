import { format } from "date-fns/format";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { Link, useLocalSearchParams } from "expo-router";
import { setStatusBarStyle } from "expo-status-bar";
import { useColorScheme } from "nativewind";
import { useEffect } from "react";
import { FormattedMessage } from "react-intl";
import { TouchableOpacity, View } from "react-native";

import { useAuth } from "@/components/providers/auth-provider";
import { ThemedText, Icon, Button, Skeleton } from "@/components/ui/atoms";
import { AvatarGroup } from "@/components/ui/molecules";
import ParallaxScrollView from "@/components/ui/organisms/parallax-scroll-view";
import { useMountains } from "@/domains/mountain/mountain.api";
import { useSummitsGet } from "@/domains/summit/summit.api";
import { useUserSummits } from "@/domains/user/user.api";
import { getFullName } from "@/domains/user/user.utils";
import { isIOS } from "@/lib/device";

export default function MountainScreen() {
  const { colorScheme } = useColorScheme();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();
  const { data: mountains } = useMountains();

  useEffect(() => {
    if (!isIOS) return;

    setStatusBarStyle("light", true);
    return () => {
      setStatusBarStyle(colorScheme === "dark" ? "light" : "dark", true);
    };
  }, [colorScheme]);

  const mountain = mountains?.data?.message?.find(
    (mountain) => slug === mountain.slug,
  );

  const { data: latestSummits, isPending: isPendingLatestSummits } =
    useSummitsGet({
      limit: 100,
      mountainId: mountain?.id,
    });
  const { data: userSummits } = useUserSummits();

  const isSummited = userSummits?.summits.some(
    ({ mountainSlug }) => slug === mountainSlug,
  );

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
        {isSummited && (
          <View className="flex flex-row items-center gap-2">
            <Icon name="checkmark.seal.fill" color="#10b981" />
            <ThemedText className="text-xl font-medium text-emerald-500">
              <FormattedMessage defaultMessage="You summited this mountain" />
            </ThemedText>
          </View>
        )}
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
              <ThemedText className="text-xl font-medium">
                <FormattedMessage defaultMessage="Essential" />
              </ThemedText>
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
        <ThemedText className="text-2xl font-semibold">
          <FormattedMessage defaultMessage="View" />
        </ThemedText>
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
              <FormattedMessage defaultMessage="On" />{" "}
              <ThemedText className="text-xl font-medium text-blue-500">
                <FormattedMessage defaultMessage="maps" />
              </ThemedText>
            </ThemedText>
            <Icon name="arrow.right" muted size={20} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              Linking.openURL(
                `https://es.wikiloc.com/wikiloc/map.do?q=${mountain.name}, ${mountain.location}&fitMapToTrails=1&page=1`,
              )
            }
            className="flex-1 flex-row items-center justify-between rounded-xl border-2 border-border p-4"
          >
            <ThemedText className="text-xl font-medium">
              <FormattedMessage defaultMessage="On" />{" "}
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
        <ThemedText className="text-2xl font-semibold">
          <FormattedMessage defaultMessage="Actions" />
        </ThemedText>
        <Link
          href={
            isAuthenticated
              ? { pathname: "/mountain/[slug]/summit", params: { slug } }
              : "/join"
          }
          asChild
        >
          <Button className="flex-1">
            {isSummited ? (
              <FormattedMessage defaultMessage="Summit again" />
            ) : (
              <FormattedMessage defaultMessage="Summit" />
            )}
          </Button>
        </Link>
      </View>
      <View className="mb-32 gap-4">
        <ThemedText className="text-2xl font-semibold">
          <FormattedMessage defaultMessage="All" />
        </ThemedText>
        <View className="gap-3">
          {isPendingLatestSummits && (
            <View className="flex-row justify-between">
              <View className="gap-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
              </View>
              <Skeleton className="size-10 rounded-full" />
            </View>
          )}
          {!latestSummits?.length && !isPendingLatestSummits && (
            <ThemedText className="text-muted-foreground">
              <FormattedMessage defaultMessage="No one summited yet." />
            </ThemedText>
          )}
          {latestSummits?.map(({ summitId, summitedAt, users }) => {
            const firstName = users[0]?.firstName;
            const firstNameSecond = users[1]?.firstName;

            return (
              <View
                key={summitId}
                className="flex-row items-end justify-between gap-4"
              >
                <View>
                  <ThemedText className="font-black">
                    <ThemedText className="font-medium">{firstName}</ThemedText>
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
          })}
        </View>
      </View>
    </ParallaxScrollView>
  );
}
