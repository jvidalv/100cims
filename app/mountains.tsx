import { analytics } from "expofast-analytics";
import { useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { FlatList, Pressable, ScrollView, View } from "react-native";
import { twMerge } from "tailwind-merge";

import { ThemedView, ThemedText, SearchInput } from "@/components/ui/atoms";
import { MountainItemList, ScreenHeader } from "@/components/ui/molecules";
import { useMountains } from "@/domains/mountain/mountain.api";
import { useUserChallengeSummits } from "@/domains/user/user.api";
import { useLocation } from "@/hooks/use-location";
import { cleanText } from "@/lib";
import { getDistanceInKm } from "@/lib/location";

type FilterType =
  | "closest-first"
  | "higher-first"
  | "essentials"
  | "not-summited"
  | "summited";

export default function MountainsScreen() {
  const intl = useIntl();
  const { data } = useMountains();
  const [query, setQuery] = useState("");
  const [filtersSelected, setFiltersSelected] = useState<FilterType[]>([
    "closest-first",
  ]);
  const { data: userSummits } = useUserChallengeSummits();
  const { location: userLocation } = useLocation();

  const filters: {
    type: FilterType;
    name: string;
    onSelectDeselect?: FilterType[];
  }[] = [
    {
      type: "essentials",
      name: intl.formatMessage({ defaultMessage: "Essentials" }),
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

  const queriedMountains = useMemo(() => {
    const mountains = data?.data?.message;

    if (!query) return mountains;

    return mountains?.filter(({ name, location }) =>
      cleanText(`${name} ${location}`)
        .toLowerCase()
        .includes(cleanText(query).toLowerCase()),
    );
  }, [query, data?.data?.message]);

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

  return (
    <ThemedView className="flex-1">
      <ScreenHeader />
      <View>
        <FlatList
          data={filteredMountains}
          initialNumToRender={10}
          stickyHeaderIndices={[0]}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          getItemLayout={(_, index) => ({
            length: 100,
            offset: 100 * index,
            index,
          })}
          ListHeaderComponent={
            <ThemedView className="pb-2">
              <ThemedText className="mx-6 mb-2 text-4xl font-bold">
                <FormattedMessage defaultMessage="All summits" />{" "}
                <ThemedText className="text-lg font-semibold text-muted-foreground">
                  {filteredMountains?.length}
                </ThemedText>
              </ThemedText>
              <SearchInput
                className="mx-6 mb-2"
                onChangeText={(text) => {
                  setQuery(text);
                }}
                onFocus={() => {
                  analytics.action("mountain-query-search");
                }}
              />
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="pl-6 pr-4"
                horizontal
              >
                {filters.map(({ type, name, onSelectDeselect }) => {
                  const isSelected = filtersSelected.includes(type);
                  return (
                    <Pressable
                      className={twMerge(
                        "rounded-lg flex-row gap-1 items-center py-2 px-2.5 mr-1 disabled:opacity-50",
                        isSelected ? "bg-primary" : "bg-border",
                      )}
                      onPress={() => {
                        if (isSelected) {
                          setFiltersSelected((filters) =>
                            filters.filter((t) => t !== type),
                          );
                        } else {
                          analytics.action(`mountain-filter-${type}`);
                          setFiltersSelected((filters) => [
                            ...filters.filter(
                              (f) => !onSelectDeselect?.includes(f),
                            ),
                            type,
                          ]);
                        }
                      }}
                      key={name}
                    >
                      {type === "essentials" && (
                        <View
                          className={twMerge(
                            "bg-primary rounded-full size-3",
                            isSelected && "bg-white",
                          )}
                        />
                      )}
                      <ThemedText
                        className={twMerge(
                          "font-medium text-foreground",
                          isSelected && "text-white",
                        )}
                      >
                        {name}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </ThemedView>
          }
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
      </View>
    </ThemedView>
  );
}
