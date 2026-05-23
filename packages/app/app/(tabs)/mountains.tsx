import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowDownUp,
  Baby,
  ChevronUp,
  CircleDashed,
  Dog,
  Map,
  MapPin,
  Mountain,
  SearchX,
  SlidersHorizontal,
  TrendingDown,
  TriangleAlert,
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { FlatList, Pressable, View } from "react-native";


import { useAuth } from "@/components/providers/auth-provider";
import {
  LucideIcon,
  ThemedText,
  ThemedView,
  tierColor,
} from "@/components/ui/atoms";
import {
  MountainItemList,
  ScreenHeader,
  FilterableListHeader,
  type Filter,
  type SettingsGroup,
} from "@/components/ui/molecules";
import { Colors } from "@/constants/colors";
import { MountainsMap } from "@/domains/mountain/components/mountains-map";
import { useMountains } from "@/domains/mountain/mountain.api";
import {
  difficultyTier,
  safetyTier,
  type DifficultyTierKey,
} from "@/domains/mountain/rating-tiers";
import { useUserChallengeSummits } from "@/domains/user/user.api";
import { useLocation } from "@/hooks/use-location";
import { cleanText } from "@/lib";
import { getDistanceInKm } from "@/lib/location";

type FilterType = "map" | "essentials";

type SettingsFilter =
  | "alt-0-1000"
  | "alt-1000-2000"
  | "alt-2000-3000"
  | "alt-3000+"
  | "summited"
  | "not-summited"
  | "higher-first"
  | "closest-first"
  | "easiest-first"
  | "hardest-first"
  | "safest-kids"
  | "safest-dogs"
  | "diff-easy"
  | "diff-moderate"
  | "diff-hard"
  | "diff-very-hard"
  | "family-safe"
  | "dog-safe";

export default function MountainsScreen() {
  const intl = useIntl();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { view } = useLocalSearchParams<{ view?: string }>();
  const { data, isPending } = useMountains();
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [filtersSelected, setFiltersSelected] = useState<FilterType[]>(() => {
    // If view=map query param is present, include "map" filter by default
    if (view === "map") {
      return ["map"];
    }
    return [];
  });
  const { data: userSummits } = useUserChallengeSummits();
  const { location: userLocation } = useLocation({ prompt: true });
  const [settingsFilters, setSettingsFilters] = useState<SettingsFilter[]>([
    "closest-first",
  ]);

  const isMapView = filtersSelected.includes("map");

  const settingsGroups: SettingsGroup<SettingsFilter>[] = useMemo(
    () => [
      {
        title: intl.formatMessage({ defaultMessage: "Status" }),
        icon: CircleDashed,
        options: [
          {
            type: "summited",
            name: intl.formatMessage({ defaultMessage: "Summited" }),
            dotColor: Colors.light.success,
          },
          {
            type: "not-summited",
            name: intl.formatMessage({ defaultMessage: "Not summited" }),
            dotColor: "#ffffff",
          },
        ],
      },
      {
        title: intl.formatMessage({ defaultMessage: "Altitude" }),
        icon: Mountain,
        options: [
          {
            type: "alt-0-1000",
            name: "< 1.000m",
          },
          {
            type: "alt-1000-2000",
            name: "1.000 - 2.000m",
          },
          {
            type: "alt-2000-3000",
            name: "2.000 - 3.000m",
          },
          {
            type: "alt-3000+",
            name: "> 3.000m",
          },
        ],
      },
      {
        title: intl.formatMessage({ defaultMessage: "Sort" }),
        icon: ArrowDownUp,
        options: [
          {
            type: "closest-first",
            name: intl.formatMessage({ defaultMessage: "Closest first" }),
            icon: MapPin,
            disabled: isMapView,
          },
          {
            type: "higher-first",
            name: intl.formatMessage({ defaultMessage: "Higher first" }),
            icon: ChevronUp,
            disabled: isMapView,
          },
          {
            type: "easiest-first",
            name: intl.formatMessage({ defaultMessage: "Easiest first" }),
            icon: TrendingDown,
            disabled: isMapView,
          },
          {
            type: "hardest-first",
            name: intl.formatMessage({ defaultMessage: "Hardest first" }),
            icon: TriangleAlert,
            disabled: isMapView,
          },
          {
            type: "safest-kids",
            name: intl.formatMessage({ defaultMessage: "Safest for kids" }),
            icon: Baby,
            disabled: isMapView,
          },
          {
            type: "safest-dogs",
            name: intl.formatMessage({ defaultMessage: "Safest for dogs" }),
            icon: Dog,
            disabled: isMapView,
          },
        ],
      },
      {
        title: intl.formatMessage({ defaultMessage: "Difficulty" }),
        icon: TriangleAlert,
        multiSelect: true,
        options: [
          {
            type: "diff-easy",
            name: intl.formatMessage({ defaultMessage: "Easy" }),
            dotColor: tierColor(0, 5, true),
          },
          {
            type: "diff-moderate",
            name: intl.formatMessage({ defaultMessage: "Moderate" }),
            dotColor: tierColor(2, 5, true),
          },
          {
            type: "diff-hard",
            name: intl.formatMessage({ defaultMessage: "Hard" }),
            dotColor: tierColor(3, 5, true),
          },
          {
            type: "diff-very-hard",
            name: intl.formatMessage({ defaultMessage: "Very Hard" }),
            dotColor: tierColor(4, 5, true),
          },
        ],
      },
      {
        title: intl.formatMessage({ defaultMessage: "Other" }),
        icon: SlidersHorizontal,
        multiSelect: true,
        options: [
          {
            type: "family-safe",
            name: intl.formatMessage({ defaultMessage: "Safe for kids" }),
            icon: Baby,
          },
          {
            type: "dog-safe",
            name: intl.formatMessage({ defaultMessage: "Safe for dogs" }),
            icon: Dog,
          },
        ],
      },
    ],
    [intl, isMapView],
  );

  // Sync view mode with filter selection
  useEffect(() => {
    setViewMode(isMapView ? "map" : "list");
  }, [isMapView]);

  const handleFiltersChange = (newFilters: FilterType[]) => {
    const isSelectingMap =
      newFilters.includes("map") && !filtersSelected.includes("map");
    if (isSelectingMap && !isAuthenticated) {
      router.push("/join");
      return;
    }
    setFiltersSelected(newFilters);
  };

  const filters: Filter<FilterType>[] = useMemo(
    () => [
      {
        type: "map",
        name: intl.formatMessage({ defaultMessage: "Map" }),
        icon: Map,
      },
      {
        type: "essentials",
        name: intl.formatMessage({ defaultMessage: "Essentials" }),
        showDot: true,
      },
    ],
    [intl],
  );

  const queriedMountains = useMemo(() => {
    const mountains = data;

    if (!query) return mountains;

    return mountains?.filter(({ name, location }) =>
      cleanText(`${name} ${location}`)
        .toLowerCase()
        .includes(cleanText(query).toLowerCase()),
    );
  }, [query, data]);

  const filteredMountains = useMemo(() => {
    let filtered = [...(queriedMountains || [])];

    if (settingsFilters.includes("summited")) {
      filtered = filtered.filter(({ slug }) =>
        userSummits?.summits?.some(({ mountainSlug }) => mountainSlug === slug),
      );
    }

    if (settingsFilters.includes("not-summited")) {
      filtered = filtered.filter(
        ({ slug }) =>
          !userSummits?.summits?.some(
            ({ mountainSlug }) => mountainSlug === slug,
          ),
      );
    }

    if (filtersSelected.includes("essentials")) {
      filtered = filtered.filter(({ essential }) => essential);
    }

    // Altitude filtering
    const altitudeFilters = settingsFilters.filter((f) => f.startsWith("alt-"));
    if (altitudeFilters.length > 0) {
      filtered = filtered.filter(({ height }) => {
        const alt = parseInt(height);
        return altitudeFilters.some((filter) => {
          switch (filter) {
            case "alt-0-1000":
              return alt < 1000;
            case "alt-1000-2000":
              return alt >= 1000 && alt < 2000;
            case "alt-2000-3000":
              return alt >= 2000 && alt < 3000;
            case "alt-3000+":
              return alt >= 3000;
            default:
              return true;
          }
        });
      });
    }

    const diffTiers = new Set<DifficultyTierKey>(
      settingsFilters
        .filter((f) => f.startsWith("diff-"))
        .map((f) => f.slice("diff-".length) as DifficultyTierKey),
    );
    if (diffTiers.size > 0) {
      filtered = filtered.filter((m) => {
        if (!m.difficultyRatingCount || m.avgDifficulty == null) return false;
        return diffTiers.has(difficultyTier(m.avgDifficulty, intl).key);
      });
    }

    if (settingsFilters.includes("family-safe")) {
      filtered = filtered.filter((m) => {
        if (!m.familyRatingCount || m.avgFamilyFriendly == null) return false;
        return safetyTier(m.avgFamilyFriendly, intl).key === "safe";
      });
    }

    if (settingsFilters.includes("dog-safe")) {
      filtered = filtered.filter((m) => {
        if (!m.dogRatingCount || m.avgDogFriendly == null) return false;
        return safetyTier(m.avgDogFriendly, intl).key === "safe";
      });
    }

    if (settingsFilters.includes("closest-first") && userLocation) {
      filtered = filtered.sort((a, b) => {
        const distA = getDistanceInKm(userLocation.coords, {
          latitude: parseFloat(a.latitude),
          longitude: parseFloat(a.longitude),
        });
        const distB = getDistanceInKm(userLocation.coords, {
          latitude: parseFloat(b.latitude),
          longitude: parseFloat(b.longitude),
        });
        return distA - distB;
      });
    } else if (settingsFilters.includes("higher-first")) {
      filtered = filtered.sort(
        (a, b) => parseInt(b.height) - parseInt(a.height),
      );
    } else if (settingsFilters.includes("easiest-first")) {
      filtered = filtered.sort((a, b) => {
        const av = a.avgDifficulty ?? Number.POSITIVE_INFINITY;
        const bv = b.avgDifficulty ?? Number.POSITIVE_INFINITY;
        return av - bv;
      });
    } else if (settingsFilters.includes("hardest-first")) {
      filtered = filtered.sort((a, b) => {
        const av = a.avgDifficulty ?? Number.NEGATIVE_INFINITY;
        const bv = b.avgDifficulty ?? Number.NEGATIVE_INFINITY;
        return bv - av;
      });
    } else if (settingsFilters.includes("safest-kids")) {
      filtered = filtered.sort((a, b) => {
        const av = a.avgFamilyFriendly ?? Number.NEGATIVE_INFINITY;
        const bv = b.avgFamilyFriendly ?? Number.NEGATIVE_INFINITY;
        return bv - av;
      });
    } else if (settingsFilters.includes("safest-dogs")) {
      filtered = filtered.sort((a, b) => {
        const av = a.avgDogFriendly ?? Number.NEGATIVE_INFINITY;
        const bv = b.avgDogFriendly ?? Number.NEGATIVE_INFINITY;
        return bv - av;
      });
    }

    return filtered;
  }, [queriedMountains, filtersSelected, userSummits?.summits, userLocation, settingsFilters, intl]);

  // Get summited mountain slugs for map
  const summitedSlugs = useMemo(() => {
    return userSummits?.summits?.map((s) => s.mountainSlug) || [];
  }, [userSummits]);

  return (
    <ThemedView className="flex-1">
      <ScreenHeader />
      <FilterableListHeader
        title={<FormattedMessage defaultMessage="All summits" />}
        count={filteredMountains?.length}
        onSearchChange={setQuery}
        filters={filters}
        filtersSelected={filtersSelected}
        onFiltersChange={handleFiltersChange}
        settingsGroups={settingsGroups}
        settingsSelected={settingsFilters}
        onSettingsChange={setSettingsFilters}
      />

      {viewMode === "list" ? (
        <FlatList
          data={filteredMountains}
          initialNumToRender={10}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          getItemLayout={(_, index) => ({
            length: 100,
            offset: 100 * index,
            index,
          })}
          ListFooterComponent={<View className="h-32" />}
          ListEmptyComponent={
            isPending || (data?.length ?? 0) === 0 ? null : (
              <View className="items-center gap-3 px-6 pt-12">
                <LucideIcon icon={SearchX} size={32} muted />
                <ThemedText className="text-center text-muted-foreground">
                  <FormattedMessage defaultMessage="No mountains match these filters." />
                </ThemedText>
                <Pressable
                  onPress={() => {
                    setSettingsFilters([]);
                    setFiltersSelected((prev) =>
                      prev.filter((f) => f === "map"),
                    );
                  }}
                >
                  <ThemedText className="font-semibold text-primary">
                    <FormattedMessage defaultMessage="Clear filters" />
                  </ThemedText>
                </Pressable>
              </View>
            )
          }
          keyExtractor={({ id }) => id}
          renderItem={({
            item: {
              name,
              slug,
              essential,
              location,
              height,
              latitude,
              longitude,
              imageUrl,
            },
          }) => (
            <View className="px-6 py-2">
              <MountainItemList
                name={name}
                location={location}
                imageUrl={imageUrl}
                essential={essential}
                slug={slug}
                latitude={latitude}
                longitude={longitude}
                height={height}
              />
            </View>
          )}
        />
      ) : (
        <MountainsMap
          mountains={filteredMountains || []}
          summitedSlugs={summitedSlugs}
          userLocation={userLocation}
          onMountainPress={(slug) => router.push(`/mountain/${slug}`)}
          isLoading={isPending}
        />
      )}
    </ThemedView>
  );
}
