import * as Linking from "expo-linking";
import { Link, useGlobalSearchParams, useRouter } from "expo-router";
import { setStatusBarStyle } from "expo-status-bar";
import {
  ArrowRight,
  ArrowUp,
  Baby,
  BadgeCheck,
  Bookmark,
  BookmarkCheck,
  CalendarPlus,
  ChevronRight,
  CircleDot,
  Dog,
  Map,
  MapPin,
  Share as ShareIcon,
  TriangleAlert,
  type LucideIcon as LucideIconType,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useEffect, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Alert, TouchableOpacity, View } from "react-native";



import { useAuth } from "@/components/providers/auth-provider";
import { SummitCard } from "@/components/summit";
import {
  LucideIcon,
  Skeleton,
  ThemedText,
  withAlpha,
} from "@/components/ui/atoms";
import { Image } from "@/components/ui/atoms/image";
import {
  ActionRow,
  MountainRowMinimal,
  TopMountainComments,
  UpdatesDialog,
} from "@/components/ui/molecules";
import { PlanItemListCompact } from "@/components/ui/molecules/plan-item-list-compact";
import ParallaxScrollView from "@/components/ui/organisms/parallax-scroll-view";
import { useMountainOne, useMountains } from "@/domains/mountain/mountain.api";
import {
  type RatingAxis,
  resolveRatingTier,
} from "@/domains/mountain/rating-tiers";
import { usePlansByMountain } from "@/domains/plan/plan.api";
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

// Hold the review prompt until the user has summited a few mountains —
// someone three peaks in is far likelier to leave a positive review.
const REVIEW_PROMPT_MIN_PEAKS = 3;

export default function MountainScreen() {
  const intl = useIntl();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  // useGlobalSearchParams (not useLocalSearchParams) — see comment in summit.tsx.
  const { slug } = useGlobalSearchParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();
  const { data: mountains } = useMountains();
  const { data: fetchedMountain, isPending: isPendingMountain } =
    useMountainOne({ mountainSlug: slug });
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

  const { data: openPlans } = usePlansByMountain(slug);

  // Permission prompt lives at the root (`LocationSync` in app/_layout.tsx);
  // this screen just reads the resolved location and status.
  const { location: userLocation, status: locationStatus } = useLocation();

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

  const eligibleForReview =
    !!isSummited &&
    (userSummits?.uniquePeaksCount ?? 0) >= REVIEW_PROMPT_MIN_PEAKS;

  useEffect(() => {
    if (eligibleForReview) {
      void askForReview();
    }
  }, [eligibleForReview]);

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
        <ActionRow
          onPress={() =>
            router.push({
              pathname: "/plans/create",
              params: { mountainId: mountain.id },
            })
          }
          icon={CalendarPlus}
          intent="muted"
        >
          <FormattedMessage defaultMessage="Create plan" />
        </ActionRow>
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
      <View className="gap-2">
        <ThemedText className="text-2xl font-semibold">
          <FormattedMessage defaultMessage="Ratings" />
        </ThemedText>
        {(
          [
            {
              key: "difficulty",
              icon: TriangleAlert,
              prefix: <FormattedMessage defaultMessage="Difficulty" />,
              count: fetchedMountain?.difficultyRatingCount,
              avg: fetchedMountain?.avgDifficulty,
            },
            {
              key: "family",
              icon: Baby,
              prefix: <FormattedMessage defaultMessage="Family" />,
              count: fetchedMountain?.familyRatingCount,
              avg: fetchedMountain?.avgFamilyFriendly,
            },
            {
              key: "dog",
              icon: Dog,
              prefix: <FormattedMessage defaultMessage="Dogs" />,
              count: fetchedMountain?.dogRatingCount,
              avg: fetchedMountain?.avgDogFriendly,
            },
          ] as const
        ).map((row) => {
          const hasData = (row.count ?? 0) > 0 && row.avg != null;
          const resolved = hasData
            ? resolveRatingTier(row.key, row.avg, intl)
            : null;
          return (
            <RatingActionRow
              key={row.key}
              icon={row.icon}
              prefix={row.prefix}
              loading={isPendingMountain}
              label={
                resolved?.label ??
                intl.formatMessage({ defaultMessage: "Unknown" })
              }
              color={resolved?.color ?? RATING_UNKNOWN_COLOR}
              count={row.count ?? 0}
              onPress={() => setActiveRating(row.key)}
            />
          );
        })}
      </View>
      {openPlans && openPlans.length > 0 && (
        <View className="gap-4">
          <ThemedText className="text-2xl font-semibold">
            <FormattedMessage defaultMessage="Open plans" />
          </ThemedText>
          <View className="gap-3">
            {openPlans.map((plan) => (
              <PlanItemListCompact
                key={plan.id}
                id={plan.id}
                title={plan.title}
                imageUrl={plan.imageUrl}
                startDate={plan.date}
                status={plan.status}
                planType={plan.planType}
                isPrivate={plan.isPrivate}
                featured={plan.featured}
                mountains={plan.mountains}
                users={plan.users}
              />
            ))}
          </View>
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
        <View className="flex-row items-center justify-between">
          <ThemedText className="text-2xl font-semibold">
            <FormattedMessage
              defaultMessage="Last {count}"
              values={{ count: latestSummits?.length ?? 0 }}
            />
          </ThemedText>
          {/* "All →" mirrors the home dashboard's "More →" pattern
              (`(tabs)/(home)/index.tsx`). Pushes onto the Details stack
              so the mountain tab bar stays visible — works because
              `(details)` is a route group with its own Stack layout. */}
          <Link
            href={{
              pathname: "/mountain/[slug]/summits",
              params: { slug },
            }}
            className="z-10 -mx-2 px-2"
          >
            <View className="flex-row items-center gap-1">
              <ThemedText className="text-muted-foreground">
                <FormattedMessage defaultMessage="All" />
              </ThemedText>
              <LucideIcon icon={ArrowRight} size={12} muted />
            </View>
          </Link>
        </View>
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
  axis: RatingAxis,
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
    const { label, color } = resolveRatingTier(
      "difficulty",
      m.avgDifficulty ?? 0,
      intl,
    );
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
    const { label, color } = resolveRatingTier(
      "family",
      m.avgFamilyFriendly ?? 0,
      intl,
    );
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
  const { label, color } = resolveRatingTier(
    "dog",
    m.avgDogFriendly ?? 0,
    intl,
  );
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

// Neutral gray for ratings with no data yet — distinct from the red→green
// tier gradient so an "Unknown" row reads as absent, not as a real score.
const RATING_UNKNOWN_COLOR = "rgb(115, 115, 115)";

function RatingActionRow({
  icon,
  prefix,
  label,
  color,
  count,
  loading,
  onPress,
}: {
  icon: LucideIconType;
  prefix: React.ReactNode;
  label: string;
  color: string;
  count: number;
  loading?: boolean;
  onPress: () => void;
}) {
  // While loading, the icon and section label stay put — only the rating word
  // and count are unknown, so just those become skeletons.
  const iconColor = loading ? RATING_UNKNOWN_COLOR : color;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      className="flex-row items-center gap-2"
    >
      <View
        className="size-8 items-center justify-center rounded-full"
        style={{ backgroundColor: withAlpha(iconColor, 0.15) }}
      >
        <LucideIcon icon={icon} size={16} color={iconColor} />
      </View>
      <View className="flex-1 flex-row items-center gap-1">
        <ThemedText className="font-medium">{prefix}</ThemedText>
        {loading ? (
          <Skeleton style={{ width: 56, height: 14, borderRadius: 4 }} />
        ) : (
          <ThemedText className="font-medium" style={{ color }}>
            {label}
          </ThemedText>
        )}
      </View>
      <View className="flex-row items-center gap-0.5">
        {loading ? (
          <Skeleton style={{ width: 14, height: 14, borderRadius: 4 }} />
        ) : count > 0 ? (
          <ThemedText
            className="text-muted-foreground"
            style={{ opacity: 0.6 }}
          >
            {count}
          </ThemedText>
        ) : null}
        <LucideIcon icon={ChevronRight} size={18} muted />
      </View>
    </TouchableOpacity>
  );
}

