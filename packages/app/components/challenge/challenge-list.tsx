import { useRouter } from "expo-router";
import {
  Flame,
  Lightbulb,
  MapPin,
  Plus,
  Trophy,
  type LucideIcon as LucideIconType,
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { twMerge } from "tailwind-merge";

import { useAuth } from "@/components/providers/auth-provider";
import {
  ActivityIndicator,
  LucideIcon,
  SearchInput,
  Skeleton,
  ThemedText,
  ThemedView,
} from "@/components/ui/atoms";
import {
  ActionRow,
  BLURRED_SCREEN_HEADER_HEIGHT,
  ChallengeRowMinimal,
} from "@/components/ui/molecules";
import {
  useActiveChallenge,
  useChallengesGet,
} from "@/domains/challenge/challenge.api";
import { countryToEmoji } from "@/domains/challenge/challenge.model";
import { useCommunityChallengesList } from "@/domains/community-challenge/community-challenge.api";
import {
  useUpdateUserMeMutation,
  useUserChallenges,
  useUserMe,
} from "@/domains/user/user.api";
import { useLocation } from "@/hooks/use-location";
import { getDistanceInKm } from "@/lib/location";

type Variant = "official" | "community";

type Props = {
  variant: Variant;
};

type Sort = "most-active" | "closer" | "most-completed";

// The data shape this component handles. Official and community challenge
// rows overlap on these fields plus a couple of variant-only extras
// (`emoji`, `creatorId`); we narrow on demand below.
type ChallengeRow = {
  id: string;
  name: string;
  country: string;
  peakImageUrl: string | null;
  totalMountains: string;
  totalUsers: string;
  centroidLatitude: string | null;
  centroidLongitude: string | null;
  emoji?: string | null;
  creatorId?: string | null;
};

/**
 * Shared list body for the Official / Community challenge tabs.
 *
 * Layout: search input + sort pills at the top (fixed), then a scrollable
 * list of `<ChallengeRowMinimal>` rows. The user's active challenge sits at
 * the top of the list with a highlighted style; it stays first regardless
 * of which sort is selected, but a search query that excludes it by name
 * still hides it. Pill styling and the 300 ms debounce mirror /user/summits.
 */
export const ChallengeList = ({ variant }: Props) => {
  const router = useRouter();
  const intl = useIntl();
  const { isAuthenticated } = useAuth();
  const { data: activeChallenge } = useActiveChallenge();
  const { data: officialChallenges, isPending: isPendingOfficial } =
    useChallengesGet();
  const { data: communityChallenges, isPending: isPendingCommunity } =
    useCommunityChallengesList();
  const { data: user } = useUserMe();
  const {
    mutateAsync: updateUser,
    isPending: isUpdatingActive,
    variables,
  } = useUpdateUserMeMutation();

  // Per-challenge summit counts for the current user. The endpoint only
  // returns challenges where summitCount >= 1, so anything not in the map is
  // treated as zero. Gated on `user.id` so unauthenticated viewers skip the
  // request entirely.
  const { data: userChallenges } = useUserChallenges({
    userId: user?.id ?? "",
    enabled: !!user?.id,
  });
  const summitedByChallengeId = useMemo(() => {
    const map = new Map<string, number>();
    if (userChallenges) {
      for (const uc of userChallenges) {
        map.set(uc.id, uc.summitCount);
      }
    }
    return map;
  }, [userChallenges]);

  // Soft-prompt only; the main mountains tab already takes care of asking.
  const { location: userLocation } = useLocation({ prompt: false });

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState<Sort>("most-active");

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  const isCommunity = variant === "community";
  const activeChallengeId = activeChallenge?.id;
  const rawChallenges: ChallengeRow[] | undefined = isCommunity
    ? communityChallenges
    : officialChallenges;
  const isPendingList = isCommunity ? isPendingCommunity : isPendingOfficial;

  const closerAvailable = userLocation != null;

  // Filter (by search) and sort (by selected pill). The active challenge
  // gets no special positioning -- it's already visually distinguished by
  // the primary-coloured title in <ChallengeRowMinimal isSelected>.
  const visibleChallenges = useMemo(() => {
    if (!rawChallenges) return rawChallenges;
    const q = debouncedSearch.trim().toLowerCase();
    const filtered = q
      ? rawChallenges.filter((c) => c.name.toLowerCase().includes(q))
      : rawChallenges;

    switch (sort) {
      case "most-active":
        return [...filtered].sort(
          (a, b) => Number(b.totalUsers ?? 0) - Number(a.totalUsers ?? 0),
        );
      case "closer":
        return userLocation
          ? [...filtered].sort((a, b) => {
              const da = distanceOrInfinity(userLocation.coords, a);
              const db = distanceOrInfinity(userLocation.coords, b);
              return da - db;
            })
          : filtered;
      case "most-completed":
        return [...filtered].sort(
          (a, b) =>
            completionRatio(b, summitedByChallengeId) -
            completionRatio(a, summitedByChallengeId),
        );
    }
  }, [
    rawChallenges,
    debouncedSearch,
    sort,
    userLocation,
    summitedByChallengeId,
  ]);

  const sortOptions: {
    value: Sort;
    label: string;
    icon: LucideIconType;
    disabled?: boolean;
  }[] = useMemo(
    () => [
      {
        value: "most-active",
        label: intl.formatMessage({ defaultMessage: "Most active" }),
        icon: Flame,
      },
      {
        value: "closer",
        label: intl.formatMessage({ defaultMessage: "Closer" }),
        icon: MapPin,
        disabled: !closerAvailable,
      },
      {
        value: "most-completed",
        label: intl.formatMessage({ defaultMessage: "Most completed" }),
        icon: Trophy,
      },
    ],
    [intl, closerAvailable],
  );

  const onChallengeSelect = async (id: string) => {
    if (!isAuthenticated) {
      router.push("/join");
      return;
    }
    await updateUser({ activeChallengeId: id });
    router.back();
  };

  const onCreateChallenge = () => {
    if (!isAuthenticated) {
      router.push("/join");
      return;
    }
    router.push("/user/challenges");
  };

  return (
    <ThemedView className="flex-1">
      {/* Fixed header: clears the BlurredScreenHeader and holds the New
          challenge button, the pinned active card, the search input, and the
          sort pills. Only the rows below it scroll. */}
      <View
        className="gap-3 px-6 pb-3"
        style={{ paddingTop: BLURRED_SCREEN_HEADER_HEIGHT }}
      >
        <SearchInput onChangeText={setSearchInput} />

        <View className="flex-row gap-2">
          {sortOptions.map((option) => {
            const selected = sort === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                onPress={() => setSort(option.value)}
                disabled={option.disabled}
                className={twMerge(
                  "flex-row items-center gap-1.5 rounded-full border-2 px-3 py-1.5",
                  selected ? "border-primary bg-primary/10" : "border-border",
                  option.disabled && "opacity-40",
                )}
              >
                <LucideIcon
                  icon={option.icon}
                  size={14}
                  muted={!selected}
                  primary={selected}
                />
                <ThemedText
                  className={twMerge(
                    "text-sm font-medium",
                    selected ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {option.label}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 8,
          paddingBottom: 160,
          gap: 12,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {isPendingList && !rawChallenges && (
          <View className="gap-3">
            {[0, 1, 2, 3].map((i) => (
              <View key={i} className="flex-row items-center gap-3">
                <Skeleton className="size-10 rounded" />
                <View className="flex-1 gap-1.5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </View>
              </View>
            ))}
          </View>
        )}

        {visibleChallenges?.map((challenge) => {
          const displayEmoji = challenge.emoji
            ? challenge.emoji
            : countryToEmoji(challenge.country);
          const distance =
            sort === "closer" && userLocation
              ? distanceForRow(userLocation.coords, challenge)
              : null;
          return (
            <ChallengeRowMinimal
              key={challenge.id}
              name={challenge.name}
              emoji={displayEmoji}
              peakImageUrl={challenge.peakImageUrl}
              totalMountains={challenge.totalMountains}
              totalUsers={challenge.totalUsers}
              summitedCount={summitedByChallengeId.get(challenge.id) ?? 0}
              distance={distance}
              isSelected={challenge.id === activeChallengeId}
              onPress={() => onChallengeSelect(challenge.id)}
              rightElement={
                isUpdatingActive &&
                variables?.activeChallengeId === challenge.id ? (
                  <ActivityIndicator className="opacity-30" />
                ) : null
              }
            />
          );
        })}

        {visibleChallenges &&
          visibleChallenges.length === 0 &&
          !isPendingList && (
            <View className="mt-4 items-center">
              <ThemedText className="text-center text-muted-foreground">
                {debouncedSearch ? (
                  <FormattedMessage defaultMessage="No challenges match your search." />
                ) : isCommunity ? (
                  <FormattedMessage defaultMessage="No community challenges yet. Be the first to create one!" />
                ) : (
                  <FormattedMessage defaultMessage="No more challenges to show." />
                )}
              </ThemedText>
            </View>
          )}

        <View className="mt-2">
          {isCommunity ? (
            <ActionRow icon={Plus} onPress={onCreateChallenge}>
              <FormattedMessage defaultMessage="New challenge" />
            </ActionRow>
          ) : (
            <ActionRow
              icon={Lightbulb}
              onPress={() => router.push("/user/suggestions")}
            >
              <FormattedMessage defaultMessage="Suggest a new challenge" />
            </ActionRow>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
};

const distanceOrInfinity = (
  from: { latitude: number; longitude: number },
  row: ChallengeRow,
): number => {
  if (row.centroidLatitude == null || row.centroidLongitude == null) {
    return Number.POSITIVE_INFINITY;
  }
  return getDistanceInKm(from, {
    latitude: parseFloat(row.centroidLatitude),
    longitude: parseFloat(row.centroidLongitude),
  });
};

const distanceForRow = (
  from: { latitude: number; longitude: number },
  row: ChallengeRow,
): number | null => {
  if (row.centroidLatitude == null || row.centroidLongitude == null) {
    return null;
  }
  return getDistanceInKm(from, {
    latitude: parseFloat(row.centroidLatitude),
    longitude: parseFloat(row.centroidLongitude),
  });
};

const completionRatio = (
  row: ChallengeRow,
  summitedByChallengeId: Map<string, number>,
): number => {
  const total = Number(row.totalMountains) || 0;
  if (total === 0) return 0;
  const summited = summitedByChallengeId.get(row.id) ?? 0;
  return summited / total;
};
