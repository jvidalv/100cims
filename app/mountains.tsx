import { ThemedView, ThemedText, SearchInput } from "@/components/ui/atoms";
import { useMountains } from "@/domains/mountains/mountains.api";
import { Header } from "@/components/navigation";
import { FlatList, ScrollView, TouchableOpacity, View } from "react-native";
import { MountainItemList } from "@/components/ui/molecules";
import { useMemo, useState } from "react";
import { cleanText } from "@/lib";
import clsx from "clsx";

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
          ListHeaderComponent={
            <ThemedView className="pb-2 px-6">
              <ThemedText className="text-4xl font-bold mb-2">
                All peaks
              </ThemedText>
              <SearchInput onChangeText={setQuery} className="mb-2" />
              <ScrollView horizontal>
                {filters.map(({ type, name }) => {
                  const isSelected = filtersSelected.includes(type);

                  return (
                    <TouchableOpacity
                      className={clsx(
                        "rounded-2xl text-foreground p-2 mr-1",
                        isSelected ? "bg-accent" : "bg-border",
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
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </ThemedView>
          }
          ListFooterComponent={<View className="h-32" />}
          keyExtractor={({ id }) => id}
          renderItem={({
            item: { name, slug, essential, location, height, image_url },
          }) => (
            <View className="px-6 py-2">
              <MountainItemList
                name={name}
                location={location}
                image_url={image_url}
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
