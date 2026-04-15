import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { setStatusBarStyle } from "expo-status-bar";
import {
  ArrowUp,
  BadgeCheck,
  Footprints,
  Map,
  MapPin,
  Share as ShareIcon,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useEffect, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { TouchableOpacity, Image, View, StyleSheet } from "react-native";


import { useAuth } from "@/components/providers/auth-provider";
import { SummitCard } from "@/components/summit";
import { ThemedText, LucideIcon, Skeleton } from "@/components/ui/atoms";
import { ActionRow, MountainItemList } from "@/components/ui/molecules";
import ParallaxScrollView from "@/components/ui/organisms/parallax-scroll-view";
import { useMountainOne, useMountains } from "@/domains/mountain/mountain.api";
import { useSummitsGet } from "@/domains/summit/summit.api";
import { useUserChallengeSummits } from "@/domains/user/user.api";
import { useLocation } from "@/hooks/use-location";
import { isIOS } from "@/lib/device";
import { getDistanceInKm } from "@/lib/location";
import { askForReview } from "@/lib/reviews";
import { shareDeeplink } from "@/lib/share";

export default function MountainScreen() {
  const intl = useIntl();
  const router = useRouter();
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
      limit: 30,
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
    await shareDeeplink({
      intl,
      path: `mountain/${slug}`,
      messages: {
        en: `🏔️ Check out the ${mountain.name} summit on cims!`,
        es: `🏔️ Mira la cima ${mountain.name} en cims!`,
        ca: `🏔️ Mira el cim ${mountain.name} a cims!`,
      },
    });
  };

  return (
    <ParallaxScrollView
      title={mountain.name}
      headerClassName="flex items-center justify-center bg-primary"
      contentClassName="gap-8 px-6 py-6"
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
            <LucideIcon icon={BadgeCheck} color="#10b981" />
            <ThemedText className="text-xl font-medium text-emerald-500">
              <FormattedMessage defaultMessage="You summited this mountain" />
            </ThemedText>
          </View>
        )}
        <View className="flex-row gap-4">
          <View className="flex-row gap-2">
            <LucideIcon icon={ArrowUp} muted />
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
          <LucideIcon icon={Map} muted />
          <ThemedText className="text-xl font-medium">
            {mountain.location}
          </ThemedText>
        </View>
        {distanceFromUser != null && (
          <View className="flex-row items-center gap-2">
            <LucideIcon icon={MapPin} muted />
            <ThemedText className="text-xl font-medium">
              <FormattedMessage
                defaultMessage="{distance} km away from you"
                values={{ distance: distanceFromUser }}
              />
            </ThemedText>
          </View>
        )}
      </View>
      <View className="gap-2">
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
          <ActionRow icon={Footprints} iconSize={18} intent="primary">
            {isSummited ? (
              <FormattedMessage defaultMessage="Summit again" />
            ) : (
              <FormattedMessage defaultMessage="Summit" />
            )}
          </ActionRow>
        </Link>
        <ActionRow
          onPress={handleShareMountain}
          icon={ShareIcon}
          intent="muted"
        >
          <FormattedMessage defaultMessage="Share with your friends" />
        </ActionRow>
        <ActionRow
          onPress={() => {
            void Linking.openURL(
              `https://www.google.es/maps?q=${mountain.latitude},${mountain.longitude}`,
            );
          }}
          icon={Map}
          intent="blue"
        >
          <FormattedMessage defaultMessage="View on maps" />
        </ActionRow>
        <TouchableOpacity
          onPress={() => {
            const locale = intl.locale as "en" | "es" | "ca";
            const wikilocSubdomain =
              locale === "ca" || locale === "es" ? locale : "en";
            void Linking.openURL(
              `https://${wikilocSubdomain}.wikiloc.com/wikiloc/map.do?q=${mountain.name}, ${mountain.location}&fitMapToTrails=1&page=1`,
            );
          }}
          className="flex-row items-center gap-2"
        >
          <View className="size-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <LucideIcon icon={Map} size={16} color="#4b8c2a" />
          </View>
          <ThemedText style={{ color: "#4b8c2a" }}>
            <FormattedMessage defaultMessage="View on wikiloc" />
          </ThemedText>
        </TouchableOpacity>
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
                  pointerEvents="none"
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
                <View
                  pointerEvents="none"
                  className="absolute bottom-1 left-2"
                >
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
          <FormattedMessage
            defaultMessage="Last {count}"
            values={{ count: latestSummits?.length ?? 0 }}
          />
        </ThemedText>
        {isPendingLatestSummits && (
          <View className="flex-row flex-wrap">
            <View className="w-1/2 pr-1">
              <Skeleton style={{ height: 243, borderRadius: 6 }} />
            </View>
            <View className="w-1/2 pl-1">
              <Skeleton style={{ height: 243, borderRadius: 6 }} />
            </View>
          </View>
        )}
        {!latestSummits?.length && !isPendingLatestSummits && (
          <ThemedText className="text-muted-foreground">
            <FormattedMessage defaultMessage="No one summited yet." />
          </ThemedText>
        )}
        <View className="flex-row flex-wrap">
          {latestSummits?.map((summit, index) => (
            <SummitCard
              key={summit.summitId}
              summit={summit}
              index={index}
              onPress={() =>
                router.push({
                  pathname: "/user/summits/[summit]",
                  params: { summit: summit.summitId },
                })
              }
              onParticipantPress={(userId) => router.push(`/user/${userId}`)}
            />
          ))}
        </View>
      </View>
    </ParallaxScrollView>
  );
}
