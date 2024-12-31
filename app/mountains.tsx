import { useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, View } from "react-native";
import { twMerge } from "tailwind-merge";

import { Header } from "@/components/navigation";
import { ThemedView, ThemedText, SearchInput } from "@/components/ui/atoms";
import { MountainItemList } from "@/components/ui/molecules";
import { useMountains } from "@/domains/mountain/mountain.api";
import { cleanText } from "@/lib";

type FilterType = "higher-first" | "essentials";

export default function MountainsScreen() {
  const { data } = useMountains();
  const [query, setQuery] = useState("");
  const [filtersSelected, setFiltersSelected] = useState<FilterType[]>([]);
  const filters: { type: FilterType; name: string }[] = [
    {
      type: "higher-first",
      name: "Higher",
    },
    { type: "essentials", name: "Essentials" },
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

    if (filtersSelected.includes("essentials")) {
      filtered = filtered?.filter(({ essential }) => essential);
    }

    if (filtersSelected.includes("higher-first")) {
      filtered = filtered?.sort(
        (a, b) => parseInt(b.height) - parseInt(a.height),
      );
    }

    return filtered;
  }, [queriedMountains, filtersSelected]);

  return (
    <ThemedView className="flex-1">
      <Header />
      <View>
        <FlatList
          data={filteredMountains}
          initialNumToRender={10}
          stickyHeaderIndices={[0]}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <ThemedView className="px-6 pb-2">
              <ThemedText className="mb-2 text-4xl font-bold">
                All peaks
              </ThemedText>
              <SearchInput onChangeText={setQuery} className="mb-2" />
              <ScrollView keyboardShouldPersistTaps="handled" horizontal>
                {filters.map(({ type, name }) => {
                  const isSelected = filtersSelected.includes(type);

                  return (
                    <Pressable
                      className={twMerge(
                        "rounded-xl text-foreground py-2 px-2.5 mr-1",
                        isSelected ? "bg-primary" : "bg-border",
                      )}
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
                      <ThemedText className="font-medium">{name}</ThemedText>
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
