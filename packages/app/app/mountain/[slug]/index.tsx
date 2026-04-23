import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { setStatusBarStyle } from "expo-status-bar";
import {
  ArrowUp,
  Baby,
  BadgeCheck,
  Bookmark,
  BookmarkCheck,
  CircleDot,
  Dog,
  Footprints,
  Map,
  MapPin,
  Share as ShareIcon,
  TriangleAlert,
  type LucideIcon as LucideIconType,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useEffect, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { TouchableOpacity, Image, Pressable, View, StyleSheet } from "react-native";


import { useAuth } from "@/components/providers/auth-provider";
import { SummitCard } from "@/components/summit";
import {
  LucideIcon,
  Skeleton,
  ThemedText,
  tierColor,
} from "@/components/ui/atoms";
import {
  ActionRow,
  MountainItemList,
  UpdatesDialog,
} from "@/components/ui/molecules";
import ParallaxScrollView from "@/components/ui/organisms/parallax-scroll-view";
import { useMountainOne, useMountains } from "@/domains/mountain/mountain.api";
import {
  useIsMountainSaved,
  useSavedAddMutation,
  useSavedRemoveMutation,
} from "@/domains/saved/saved.api";
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
  const [activeRating, setActiveRating] = useState<
    null | "difficulty" | "family" | "dog"
  >(null);

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

  const isSaved = useIsMountainSaved(mountain?.id);
  const savedAddMutation = useSavedAddMutation();
  const savedRemoveMutation = useSavedRemoveMutation();
  const handleToggleSaved = () => {
    if (!isAuthenticated) {
      router.push("/join");
      return;
    }
    if (!mountain?.id) return;
    if (isSaved) {
      savedRemoveMutation.mutate({ mountainId: mountain.id });
    } else {
      savedAddMutation.mutate({ mountainId: mountain.id });
    }
  };

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

  const activeRatingUpdate =
    activeRating && fetchedMountain
      ? buildRatingUpdate(activeRating, fetchedMountain, intl)
      : null;

  return (
    <>
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
              <LucideIcon icon={CircleDot} primary />
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
        {fetchedMountain &&
          (fetchedMountain.difficultyRatingCount > 0 ||
            fetchedMountain.familyRatingCount > 0 ||
            fetchedMountain.dogRatingCount > 0) && (
            <View className="flex-row flex-wrap items-center gap-x-4 gap-y-2">
              {fetchedMountain.difficultyRatingCount > 0 &&
                fetchedMountain.avgDifficulty != null && (
                  <Pressable
                    onPress={() => setActiveRating("difficulty")}
                    hitSlop={8}
                  >
                    <RatingTag
                      icon={TriangleAlert}
                      label={difficultyTierLabel(
                        fetchedMountain.avgDifficulty,
                        intl,
                      )}
                      color={tierColor(
                        Math.round(fetchedMountain.avgDifficulty) - 1,
                        5,
                        true,
                      )}
                    />
                  </Pressable>
                )}
              {fetchedMountain.familyRatingCount > 0 &&
                fetchedMountain.avgFamilyFriendly != null && (
                  <Pressable
                    onPress={() => setActiveRating("family")}
                    hitSlop={8}
                  >
                    {(() => {
                      const tier = safetyTier(
                        fetchedMountain.avgFamilyFriendly,
                        intl,
                      );
                      return (
                        <RatingTag
                          icon={Baby}
                          label={tier.label}
                          color={tierColor(tier.position, 3)}
                        />
                      );
                    })()}
                  </Pressable>
                )}
              {fetchedMountain.dogRatingCount > 0 &&
                fetchedMountain.avgDogFriendly != null && (
                  <Pressable
                    onPress={() => setActiveRating("dog")}
                    hitSlop={8}
                  >
                    {(() => {
                      const tier = safetyTier(
                        fetchedMountain.avgDogFriendly,
                        intl,
                      );
                      return (
                        <RatingTag
                          icon={Dog}
                          label={tier.label}
                          color={tierColor(tier.position, 3)}
                        />
                      );
                    })()}
                  </Pressable>
                )}
            </View>
          )}
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
          onPress={handleToggleSaved}
          icon={isSaved ? BookmarkCheck : Bookmark}
          intent={isSaved ? "emerald" : "muted"}
        >
          {isSaved ? (
            <FormattedMessage defaultMessage="Saved" />
          ) : (
            <FormattedMessage defaultMessage="Save" />
          )}
        </ActionRow>
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
      {activeRatingUpdate && (
        <UpdatesDialog
          update={activeRatingUpdate}
          isOpen={activeRating !== null}
          onClose={() => setActiveRating(null)}
        />
      )}
    </>
  );
}

// Thresholds: users only vote 1 or 5, so the aggregate is 1 + 4·(safe/total).
// Unsafe: ≤20% of votes say Safe. Safe: ≥80% say Safe. Mixed: the ambiguous
// middle band, honest about "ratings disagree."
const safetyTier = (
  avg: number,
  intl: ReturnType<typeof useIntl>,
): { label: string; position: 0 | 1 | 2 } => {
  if (avg >= 4) {
    return {
      label: intl.formatMessage({ defaultMessage: "Safe" }),
      position: 2,
    };
  }
  if (avg <= 2) {
    return {
      label: intl.formatMessage({ defaultMessage: "Unsafe" }),
      position: 0,
    };
  }
  return {
    label: intl.formatMessage({ defaultMessage: "Mixed" }),
    position: 1,
  };
};

const difficultyTierLabel = (avg: number, intl: ReturnType<typeof useIntl>) => {
  const rounded = Math.round(avg);
  if (rounded <= 2) return intl.formatMessage({ defaultMessage: "Easy" });
  if (rounded >= 4) return intl.formatMessage({ defaultMessage: "Hard" });
  return intl.formatMessage({ defaultMessage: "Moderate" });
};

type FetchedMountain = {
  avgFamilyFriendly: number | null;
  familyRatingCount: number;
  avgDogFriendly: number | null;
  dogRatingCount: number;
  avgDifficulty: number | null;
  difficultyRatingCount: number;
};

const buildRatingUpdate = (
  axis: "difficulty" | "family" | "dog",
  m: FetchedMountain,
  intl: ReturnType<typeof useIntl>,
) => {
  const ratingsWord = (count: number) =>
    count === 1
      ? intl.formatMessage({ defaultMessage: "rating" })
      : intl.formatMessage({ defaultMessage: "ratings" });

  const countChunk = (count: number) => (
    <ThemedText key="count" className="font-semibold text-foreground">
      {count} {ratingsWord(count)}
    </ThemedText>
  );
  const labelChunk = (label: string, color: string) => (
    <ThemedText key="label" className="font-semibold" style={{ color }}>
      {label.toLowerCase()}
    </ThemedText>
  );

  if (axis === "difficulty") {
    const count = m.difficultyRatingCount;
    const avg = m.avgDifficulty ?? 0;
    const label = difficultyTierLabel(avg, intl);
    const color = tierColor(Math.round(avg) - 1, 5, true);
    return {
      id: "rating-difficulty",
      title: intl.formatMessage({ defaultMessage: "Difficulty" }),
      body: (
        <View className="gap-2">
          <ThemedText className="leading-relaxed text-muted-foreground">
            <FormattedMessage
              defaultMessage="Based on {count} from summiters, this mountain is rated {label}."
              values={{
                count: countChunk(count),
                label: labelChunk(label, color),
              }}
            />
          </ThemedText>
          <ThemedText className="leading-relaxed text-muted-foreground">
            <FormattedMessage defaultMessage="Difficulty reflects the easiest route up." />
          </ThemedText>
        </View>
      ),
    };
  }
  if (axis === "family") {
    const count = m.familyRatingCount;
    const tier = safetyTier(m.avgFamilyFriendly ?? 0, intl);
    const { label } = tier;
    const color = tierColor(tier.position, 3);
    return {
      id: "rating-family",
      title: intl.formatMessage({ defaultMessage: "Family-friendly" }),
      body: (
        <View className="gap-2">
          <ThemedText className="leading-relaxed text-muted-foreground">
            <FormattedMessage
              defaultMessage="Based on {count} from summiters, this mountain is rated {label} for children."
              values={{
                count: countChunk(count),
                label: labelChunk(label, color),
              }}
            />
          </ThemedText>
          <ThemedText className="leading-relaxed text-muted-foreground">
            <FormattedMessage defaultMessage="Summiters consider the safest route up — this is a majority opinion, not a guarantee." />
          </ThemedText>
        </View>
      ),
    };
  }
  const count = m.dogRatingCount;
  const tier = safetyTier(m.avgDogFriendly ?? 0, intl);
  const { label } = tier;
  const color = tierColor(tier.position, 3);
  return {
    id: "rating-dog",
    title: intl.formatMessage({ defaultMessage: "Dog-friendly" }),
    body: (
      <View className="gap-2">
        <ThemedText className="leading-relaxed text-muted-foreground">
          <FormattedMessage
            defaultMessage="Based on {count} from summiters, this mountain is rated {label} for dogs."
            values={{
              count: countChunk(count),
              label: labelChunk(label, color),
            }}
          />
        </ThemedText>
        <ThemedText className="leading-relaxed text-muted-foreground">
          <FormattedMessage defaultMessage="Summiters consider the safest route up — this is a majority opinion, not a guarantee." />
        </ThemedText>
      </View>
    ),
  };
};

function RatingTag({
  icon,
  label,
  color,
}: {
  icon: LucideIconType;
  label: string;
  color: string;
}) {
  return (
    <View className="flex-row items-center gap-2">
      <LucideIcon icon={icon} color={color} />
      <ThemedText className="text-xl font-medium">{label}</ThemedText>
    </View>
  );
}

