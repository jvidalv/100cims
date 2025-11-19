import { analytics } from "@jvidalv/react-analytics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { FlatList, Pressable, ScrollView, View } from "react-native";
import { twMerge } from "tailwind-merge";

import { ThemedView, ThemedText, SearchInput } from "@/components/ui/atoms";
import {
  MountainItemList,
  ScreenHeader,
  FilterableListHeader,
  type Filter,
} from "@/components/ui/molecules";
import { MountainsMap } from "@/domains/mountain/components/mountains-map";
import { useMountains } from "@/domains/mountain/mountain.api";
import { useUserChallengeSummits } from "@/domains/user/user.api";
import { useLocation } from "@/hooks/use-location";
import { cleanText } from "@/lib";
import { getDistanceInKm } from "@/lib/location";

type FilterType =
  | "map"
  | "closest-first"
  | "higher-first"
  | "essentials"
  | "not-summited"
  | "summited";

export default function MountainsScreen() {
  const intl = useIntl();
  const router = useRouter();
  const { view } = useLocalSearchParams<{ view?: string }>();
  const { data, isPending } = useMountains();
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [filtersSelected, setFiltersSelected] = useState<FilterType[]>(() => {
    // If view=map query param is present, include "map" filter by default
    if (view === "map") {
      return ["map"];
    }
    return ["closest-first"];
  });
  const { data: userSummits } = useUserChallengeSummits();
  const { location: userLocation } = useLocation();

  // Sync view mode with filter selection
  useEffect(() => {
    setViewMode(filtersSelected.includes("map") ? "map" : "list");
  }, [filtersSelected]);

  const filters: Filter<FilterType>[] = useMemo(() => {
    const isMapView = filtersSelected.includes("map");

    const allFilters: Filter<FilterType>[] = [
      {
        type: "map",
        name: intl.formatMessage({ defaultMessage: "Map" }),
        icon: "map.fill",
      },
      {
        type: "essentials",
        name: intl.formatMessage({ defaultMessage: "Essentials" }),
        showDot: true,
      },
      {
        type: "closest-first",
        name: intl.formatMessage({ defaultMessage: "Closest first" }),
        onSelectDeselect: ["higher-first"],
      },
      {
        type: "higher-first",
        name: intl.formatMessage({ defaultMessage: "Higher first" }),
        onSelectDeselect: ["closest-first"],
      },
      {
        type: "not-summited",
        name: intl.formatMessage({ defaultMessage: "Not summited" }),
        onSelectDeselect: ["summited"],
      },
      {
        type: "summited",
        name: intl.formatMessage({ defaultMessage: "Summited" }),
        onSelectDeselect: ["not-summited"],
      },
    ];

    // Filter out sorting options when in map view
    if (isMapView) {
      return allFilters.filter(
        (f) => f.type !== "closest-first" && f.type !== "higher-first",
      );
    }

    return allFilters;
  }, [filtersSelected, intl]);

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

    if (filtersSelected.includes("summited")) {
      filtered = filtered.filter(({ slug }) =>
        userSummits?.summits?.some(({ mountainSlug }) => mountainSlug === slug),
      );
    }

    if (filtersSelected.includes("not-summited")) {
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

    if (filtersSelected.includes("higher-first")) {
      filtered = filtered.sort(
        (a, b) => parseInt(b.height) - parseInt(a.height),
      );
    }

    if (filtersSelected.includes("closest-first") && userLocation) {
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
    }

    return filtered;
  }, [queriedMountains, filtersSelected, userSummits?.summits, userLocation]);

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
        onFiltersChange={setFiltersSelected}
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
