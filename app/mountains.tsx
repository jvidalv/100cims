import { useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { FlatList, Pressable, ScrollView, View } from "react-native";
import { twMerge } from "tailwind-merge";

import { ThemedView, ThemedText, SearchInput } from "@/components/ui/atoms";
import { MountainItemList } from "@/components/ui/molecules";
import { ScreenHeader } from "@/components/ui/molecules";
import { useMountains } from "@/domains/mountain/mountain.api";
import { useUserSummits } from "@/domains/user/user.api";
import { cleanText } from "@/lib";

type FilterType = "higher-first" | "essentials" | "not-summited" | "summited";

export default function MountainsScreen() {
  const intl = useIntl();
  const { data } = useMountains();
  const [query, setQuery] = useState("");
  const [filtersSelected, setFiltersSelected] = useState<FilterType[]>([]);
  const { data: userSummits } = useUserSummits();
  const filters: {
    type: FilterType;
    name: string;
    disabledIf?: () => boolean;
  }[] = [
    {
      type: "higher-first",
      name: intl.formatMessage({ defaultMessage: "Higher first" }),
    },
    {
      type: "essentials",
      name: intl.formatMessage({ defaultMessage: "Essentials" }),
    },
    {
      type: "not-summited",
      name: intl.formatMessage({ defaultMessage: "Not summited" }),
      disabledIf: () => filtersSelected.includes("summited"),
    },
    {
      type: "summited",
      name: intl.formatMessage({ defaultMessage: "Summited" }),
      disabledIf: () => filtersSelected.includes("not-summited"),
    },
  ];

  const queriedMountains = useMemo(() => {
    const mountains = data?.data?.message;

    if (!query) {
      return mountains;
    }

    return mountains?.filter(({ name, location }) =>
      cleanText(`${name} ${location}`)
        .toLowerCase()
        .includes(cleanText(query).toLowerCase()),
    );
  }, [query, data?.data?.message]);

  const filteredMountains = useMemo(() => {
    let filtered = [...(queriedMountains || [])];

    if (!filtersSelected.length) {
      return filtered;
    }

    if (filtersSelected.includes("summited")) {
      filtered = filtered?.filter(({ slug }) =>
        userSummits?.summits?.some(({ mountainSlug }) => mountainSlug === slug),
      );
    }

    if (filtersSelected.includes("not-summited")) {
      filtered = filtered?.filter(
        ({ slug }) =>
          !userSummits?.summits?.some(
            ({ mountainSlug }) => mountainSlug === slug,
          ),
      );
    }

    if (filtersSelected.includes("essentials")) {
      filtered = filtered?.filter(({ essential }) => essential);
    }

    if (filtersSelected.includes("higher-first")) {
      filtered = filtered?.sort(
        (a, b) => parseInt(b.height) - parseInt(a.height),
      );
    }

    return filtered;
  }, [queriedMountains, filtersSelected, userSummits?.summits]);

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
          ListHeaderComponent={
            <ThemedView className="pb-2">
              <ThemedText className="mx-6 mb-2 text-4xl font-bold">
                <FormattedMessage defaultMessage="All summits" />{" "}
                <ThemedText className="text-lg font-semibold text-muted-foreground">
                  {filteredMountains?.length}
                </ThemedText>
              </ThemedText>
              <SearchInput onChangeText={setQuery} className="mx-6 mb-2" />
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="pl-6 pr-4"
                horizontal
              >
                {filters.map(({ type, name, disabledIf }) => {
                  const isSelected = filtersSelected.includes(type);

                  return (
                    <Pressable
                      className={twMerge(
                        "rounded-xl py-2 px-2.5 mr-1 disabled:opacity-50",
                        isSelected ? "bg-primary" : "bg-border",
                      )}
                      disabled={disabledIf?.()}
                      onPress={() => {
                        if (isSelected) {
                          setFiltersSelected((filters) =>
                            filters.filter((t) => t !== type),
                          );
                        } else {
                          setFiltersSelected((filters) => [...filters, type]);
                        }
                      }}
                      key={name}
                    >
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
            item: { name, slug, essential, location, height, imageUrl },
          }) => (
            <View className="px-6 py-2">
              <MountainItemList
                name={name}
                location={location}
                imageUrl={imageUrl}
                essential={essential}
                slug={slug}
                height={height}
              />
            </View>
          )}
        />
      </View>
    </ThemedView>
  );
}
