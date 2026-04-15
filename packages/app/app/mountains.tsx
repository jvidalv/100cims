import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronUp, Map, MapPin } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { FlatList, View } from "react-native";


import { useAuth } from "@/components/providers/auth-provider";
import { ThemedView } from "@/components/ui/atoms";
import {
  MountainItemList,
  ScreenHeader,
  FilterableListHeader,
  type Filter,
  type SettingsGroup,
} from "@/components/ui/molecules";
import { MountainsMap } from "@/domains/mountain/components/mountains-map";
import { useMountains } from "@/domains/mountain/mountain.api";
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
  | "closest-first";

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
  const { location: userLocation } = useLocation();
  const [settingsFilters, setSettingsFilters] = useState<SettingsFilter[]>([
    "closest-first",
  ]);

  const isMapView = filtersSelected.includes("map");

  const settingsGroups: SettingsGroup<SettingsFilter>[] = useMemo(
    () => [
      {
        title: intl.formatMessage({ defaultMessage: "Status" }),
        options: [
          {
            type: "summited",
            name: intl.formatMessage({ defaultMessage: "Summited" }),
            dotColor: "#22c55e",
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

    if (settingsFilters.includes("higher-first")) {
      filtered = filtered.sort(
        (a, b) => parseInt(b.height) - parseInt(a.height),
      );
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
    }

    return filtered;
  }, [queriedMountains, filtersSelected, userSummits?.summits, userLocation, settingsFilters]);

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
