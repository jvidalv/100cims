import { format } from "date-fns/format";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { Link, useLocalSearchParams } from "expo-router";
import { setStatusBarStyle } from "expo-status-bar";
import { analytics } from "@jvidalv/react-analytics";
import { useColorScheme } from "nativewind";
import { useEffect, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { TouchableOpacity, Image, View, StyleSheet, Share } from "react-native";

import { useAuth } from "@/components/providers/auth-provider";
import { ThemedText, Icon, Button, Skeleton } from "@/components/ui/atoms";
import { AvatarGroup, MountainItemList } from "@/components/ui/molecules";
import ParallaxScrollView from "@/components/ui/organisms/parallax-scroll-view";
import { useMountainOne, useMountains } from "@/domains/mountain/mountain.api";
import { useSummitsGet } from "@/domains/summit/summit.api";
import { useUserChallengeSummits } from "@/domains/user/user.api";
import { getFullName } from "@/domains/user/user.utils";
import { useLocation } from "@/hooks/use-location";
import { getUrlDeeplink } from "@/lib/deeplink";
import { isIOS } from "@/lib/device";
import { getDistanceInKm } from "@/lib/location";
import { askForReview } from "@/lib/reviews";

export default function MountainScreen() {
  const intl = useIntl();
  const { colorScheme } = useColorScheme();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();
  const { data: mountains } = useMountains();
  const { data: fetchedMountain } = useMountainOne({ mountainSlug: slug });

  useEffect(() => {
    if (!isIOS) return;

    setStatusBarStyle("light", true);
    return () => {
      setStatusBarStyle(colorScheme === "dark" ? "light" : "dark", true);
    };
  }, [colorScheme]);

  const localMountain = mountains?.find((mountain) => slug === mountain.slug);

  const mountain = localMountain || fetchedMountain;

  const { location: userLocation } = useLocation();

  const distanceFromUser = useMemo(() => {
    if (!userLocation || !mountain) return null;

    return getDistanceInKm(userLocation.coords, {
      latitude: parseFloat(mountain.latitude),
      longitude: parseFloat(mountain.longitude),
    });
  }, [userLocation, mountain]);

  const closestMountains = useMemo(() => {
    if (!mountains || !mountain) return [];

    return mountains
      .filter((m) => m.slug !== mountain.slug)
      .map((m) => ({
        ...m,
        distance: getDistanceInKm(
          {
            latitude: parseFloat(mountain.latitude),
            longitude: parseFloat(mountain.longitude),
          },
          {
            latitude: parseFloat(m.latitude),
            longitude: parseFloat(m.longitude),
          },
        ),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 2);
  }, [mountains, mountain]);

  const { data: latestSummits, isPending: isPendingLatestSummits } =
    useSummitsGet({
      limit: 100,
      mountainId: mountain?.id,
    });
  const { data: userSummits } = useUserChallengeSummits();

  const isSummited = userSummits?.summits.some(
    ({ mountainSlug }) => slug === mountainSlug,
  );

  useEffect(() => {
    if (isSummited) {
      void askForReview();
    }
  }, [isSummited]);

  if (!mountain) {
    return null;
  }

  const handleShareMountain = async () => {
    analytics.action(`mountain-share-started`, { slug });

    const locale = intl.locale;

    const messages = {
      en: `🏔️ Check out the ${mountain.name} summit on 100cims!\n\n${getUrlDeeplink(`mountain/${slug}`)}`,
      es: `🏔️ Mira la cima ${mountain.name} en 100cims!\n\n${getUrlDeeplink(`mountain/${slug}`)}`,
      ca: `🏔️ Mira el cim ${mountain.name} a 100cims!\n\n${getUrlDeeplink(`mountain/${slug}`)}`,
    };

    const msg = messages[locale as "ca" | "es" | "en"] || messages.en;

    const response = await Share.share({
      message: msg,
    });

    if (response.action === Share.sharedAction) {
      analytics.action(`mountain-share-done`, { slug });
    } else if (response.action === Share.dismissedAction) {
      analytics.action(`mountain-share-canceled`, { slug });
    }
  };

  return (
    <ParallaxScrollView
      title={mountain.name}
      headerClassName="flex items-center justify-center bg-primary"
      contentClassName="gap-8 px-6 py-6"
      parallaxRightElement={
        <View className="flex-row  items-end gap-4 opacity-80">
          <TouchableOpacity onPress={handleShareMountain}>
            <Icon
              name="square.and.arrow.up"
              color="white"
              size={24}
              animationSpec={{ effect: { type: "bounce" } }}
            />
          </TouchableOpacity>
        </View>
      }
      headerRightElement={
        <TouchableOpacity
          onPress={handleShareMountain}
          className="flex-row items-center justify-end pb-3 pr-4"
        >
          <Icon
            name="square.and.arrow.up"
            color="white"
            animationSpec={{ effect: { type: "bounce" } }}
          />
        </TouchableOpacity>
      }
      headerImage={
        mountain.imageUrl ? (
          <Image
            source={{ uri: mountain.imageUrl, cache: "force-cache" }}
            style={{ flex: 1, width: "100%" }}
            className="bg-gray-200 dark:bg-gray-900"
          />
        ) : (
          <View className="flex-1 bg-gray-200 dark:bg-gray-900" />
        )
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
            <Icon name="arrowshape.up.fill" muted />
            <ThemedText className="text-xl font-medium">
              {mountain.height} m
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
        <View className="flex-row items-center gap-2">
          <Icon name="map.fill" muted />
          <ThemedText className="text-xl font-medium">
            {mountain.location}
          </ThemedText>
        </View>
        {distanceFromUser != null && (
          <View className="flex-row items-center gap-2">
            <Icon name="location.fill" muted />
            <ThemedText className="text-xl font-medium">
              <FormattedMessage
                defaultMessage="{distance} km away from you"
                values={{ distance: distanceFromUser }}
              />
            </ThemedText>
          </View>
        )}
      </View>
      <View className="gap-4">
        <ThemedText className="text-2xl font-semibold">
          <FormattedMessage defaultMessage="View" />
        </ThemedText>
        <View className="flex-row gap-4">
          <TouchableOpacity
            onPress={() => {
              analytics.action("mountain-view-on-maps");
              void Linking.openURL(
                `https://www.google.es/maps?q=${mountain.latitude},${mountain.longitude}`,
              );
            }}
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
            onPress={() => {
              analytics.action("mountain-view-on-wikiloc");
              const locale = intl.locale as "en" | "es" | "ca";
              const wikilocSubdomain =
                locale === "ca" || locale === "es" ? locale : "en";
              void Linking.openURL(
                `https://${wikilocSubdomain}.wikiloc.com/wikiloc/map.do?q=${mountain.name}, ${mountain.location}&fitMapToTrails=1&page=1`,
              );
            }}
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
      <View className="gap-4">
        <ThemedText className="text-2xl font-semibold">
          <FormattedMessage defaultMessage="Nearby summits" />
        </ThemedText>
        <View className="gap-3">
          {closestMountains.map(
            ({
              id,
              name,
              height,
              slug,
              imageUrl,
              essential,
              location,
              latitude,
              longitude,
              distance,
            }) => (
              <View className="relative" key={id}>
                <MountainItemList
                  name={name}
                  height={height}
                  slug={slug}
                  imageUrl={imageUrl}
                  essential={essential}
                  location={location}
                  latitude={latitude}
                  longitude={longitude}
                />
                <View
                  className="absolute overflow-hidden"
                  style={{ width: 100, height: 100, borderRadius: 6 }}
                >
                  <LinearGradient
                    colors={[
                      "transparent",
                      "transparent",
                      "transparent",
                      "rgba(0,0,0,0.6)",
                    ]}
                    style={StyleSheet.absoluteFill}
                  />
                </View>
                <View className="absolute bottom-1 left-2">
                  <ThemedText className="text-white font-medium">
                    {distance} km
                  </ThemedText>
                </View>
              </View>
            ),
          )}
        </View>
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
              <Link
                href={{
                  pathname: "/user/summits/[summit]",
                  params: { summit: summitId },
                }}
                key={summitId}
              >
                <View className="w-full flex-row items-end justify-between gap-4">
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
              </Link>
            );
          })}
        </View>
      </View>
    </ParallaxScrollView>
  );
}
