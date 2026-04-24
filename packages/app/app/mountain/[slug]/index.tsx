import * as Linking from "expo-linking";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { setStatusBarStyle } from "expo-status-bar";
import {
  ArrowUp,
  Baby,
  BadgeCheck,
  Bookmark,
  BookmarkCheck,
  ChevronRight,
  CircleDot,
  Dog,
  Footprints,
  Map,
  MapPin,
  MessageCircle,
  Share as ShareIcon,
  TriangleAlert,
  type LucideIcon as LucideIconType,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useEffect, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Alert, Image, TouchableOpacity, View } from "react-native";


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
  MountainRowMinimal,
  TopMountainComments,
  UpdatesDialog,
} from "@/components/ui/molecules";
import ParallaxScrollView from "@/components/ui/organisms/parallax-scroll-view";
import { useMountainOne, useMountains } from "@/domains/mountain/mountain.api";
import { difficultyTier, safetyTier } from "@/domains/mountain/rating-tiers";
import { useTopMountainComments } from "@/domains/mountain-comments/mountain-comments.api";
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
  const { data: topComments } = useTopMountainComments(fetchedMountain?.id);
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

  const { location: userLocation, status: locationStatus } = useLocation({
    prompt: true,
  });

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
      Alert.alert(
        intl.formatMessage({ defaultMessage: "Saved for later" }),
        intl.formatMessage(
          {
            defaultMessage: "{name} is on your saved mountains list.",
          },
          { name: mountain.name },
        ),
        [
          {
            text: intl.formatMessage({ defaultMessage: "OK" }),
            style: "cancel",
          },
          {
            text: intl.formatMessage({ defaultMessage: "View saved" }),
            onPress: () => router.push("/user/saved"),
          },
        ],
      );
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
        <View className="flex-row items-center gap-2">
          <LucideIcon icon={MapPin} muted />
          <ThemedText className="text-xl font-medium">
            {distanceFromUser != null ? (
              <FormattedMessage
                defaultMessage="{distance} km away from you"
                values={{ distance: distanceFromUser }}
              />
            ) : locationStatus === "pending" ? (
              "…"
            ) : (
              <FormattedMessage defaultMessage="Location unavailable" />
            )}
          </ThemedText>
        </View>
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
            <FormattedMessage defaultMessage="Save for later" />
          )}
        </ActionRow>
        <ActionRow
          onPress={handleShareMountain}
          icon={ShareIcon}
          intent="muted"
        >
          <FormattedMessage defaultMessage="Share with your friends" />
        </ActionRow>
        <Link
          href={{
            pathname: "/mountain/[slug]/comments",
            params: { slug },
          }}
          asChild
        >
          <ActionRow icon={MessageCircle} intent="muted" size="sm">
            <FormattedMessage defaultMessage="Comments" />
            {typeof topComments?.total === "number" && topComments.total > 0
              ? ` (${topComments.total})`
              : ""}
          </ActionRow>
        </Link>
        <ActionRow
          onPress={() => {
            void Linking.openURL(
              `https://www.google.es/maps?q=${mountain.latitude},${mountain.longitude}`,
            );
          }}
          icon={MapPin}
          intent="muted"
        >
          <FormattedMessage defaultMessage="View on maps" />
        </ActionRow>
        <ActionRow
          onPress={() => {
            const locale = intl.locale as "en" | "es" | "ca";
            const wikilocSubdomain =
              locale === "ca" || locale === "es" ? locale : "en";
            void Linking.openURL(
              `https://${wikilocSubdomain}.wikiloc.com/wikiloc/map.do?q=${mountain.name}, ${mountain.location}&fitMapToTrails=1&page=1`,
            );
          }}
          icon={Map}
          intent="muted"
        >
          <FormattedMessage defaultMessage="View on wikiloc" />
        </ActionRow>
      </View>
      {fetchedMountain &&
        (fetchedMountain.difficultyRatingCount > 0 ||
          fetchedMountain.familyRatingCount > 0 ||
          fetchedMountain.dogRatingCount > 0) && (
          <View className="gap-2">
            <ThemedText className="text-2xl font-semibold">
              <FormattedMessage defaultMessage="Ratings" />
            </ThemedText>
            {fetchedMountain.difficultyRatingCount > 0 &&
              fetchedMountain.avgDifficulty != null &&
              (() => {
                const tier = difficultyTier(
                  fetchedMountain.avgDifficulty,
                  intl,
                );
                return (
                  <RatingActionRow
                    icon={TriangleAlert}
                    prefix={<FormattedMessage defaultMessage="Difficulty" />}
                    label={tier.label}
                    color={tierColor(tier.position, 5, true)}
                    count={fetchedMountain.difficultyRatingCount}
                    onPress={() => setActiveRating("difficulty")}
                  />
                );
              })()}
            {fetchedMountain.familyRatingCount > 0 &&
              fetchedMountain.avgFamilyFriendly != null &&
              (() => {
                const tier = safetyTier(
                  fetchedMountain.avgFamilyFriendly,
                  intl,
                );
                return (
                  <RatingActionRow
                    icon={Baby}
                    prefix={<FormattedMessage defaultMessage="Family" />}
                    label={tier.label}
                    color={tierColor(tier.position, 3)}
                    count={fetchedMountain.familyRatingCount}
                    onPress={() => setActiveRating("family")}
                  />
                );
              })()}
            {fetchedMountain.dogRatingCount > 0 &&
              fetchedMountain.avgDogFriendly != null &&
              (() => {
                const tier = safetyTier(fetchedMountain.avgDogFriendly, intl);
                return (
                  <RatingActionRow
                    icon={Dog}
                    prefix={<FormattedMessage defaultMessage="Dogs" />}
                    label={tier.label}
                    color={tierColor(tier.position, 3)}
                    count={fetchedMountain.dogRatingCount}
                    onPress={() => setActiveRating("dog")}
                  />
                );
              })()}
          </View>
        )}
      <View className="gap-4">
        <ThemedText className="text-2xl font-semibold">
          <FormattedMessage defaultMessage="Nearby summits" />
        </ThemedText>
        <View className="gap-3">
          {closestMountains.map(
            ({ id, name, height, slug, imageUrl, essential, distance }) => (
              <MountainRowMinimal
                key={id}
                name={name}
                height={height}
                slug={slug}
                imageUrl={imageUrl}
                essential={essential}
                distance={distance}
                isSummited={userSummits?.summits.some(
                  (s) => s.mountainSlug === slug,
                )}
              />
            ),
          )}
        </View>
      </View>
      <TopMountainComments
        mountainId={mountain.id}
        isAuthenticated={isAuthenticated}
      />
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
    const tier = difficultyTier(m.avgDifficulty ?? 0, intl);
    const { label } = tier;
    const color = tierColor(tier.position, 5, true);
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

function RatingActionRow({
  icon,
  prefix,
  label,
  color,
  count,
  onPress,
}: {
  icon: LucideIconType;
  prefix: React.ReactNode;
  label: string;
  color: string;
  count: number;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center gap-2"
    >
      <View
        className="size-8 items-center justify-center rounded-full"
        style={{ backgroundColor: color.replace("rgb(", "rgba(").replace(")", ", 0.15)") }}
      >
        <LucideIcon icon={icon} size={16} color={color} />
      </View>
      <ThemedText className="flex-1 font-medium">
        {prefix} <ThemedText className="font-medium" style={{ color }}>{label}</ThemedText>
      </ThemedText>
      <View className="flex-row items-center gap-0.5">
        <ThemedText
          className="text-muted-foreground"
          style={{ opacity: 0.6 }}
        >
          {count}
        </ThemedText>
        <LucideIcon icon={ChevronRight} size={18} muted />
      </View>
    </TouchableOpacity>
  );
}

