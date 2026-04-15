import { Camera, Check, Globe, Plus, Sparkles } from "lucide-react-native";
import { Dispatch, SetStateAction, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  Alert,
  FlatList,
  Image,
  Keyboard,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";


import {
  ActivityIndicator,
  Button,
  LucideIcon,
  SearchInput,
  ThemedText,
  ThemedTextInput,
  ThemedView,
} from "@/components/ui/atoms";
import { ThemedToggleInput } from "@/components/ui/atoms/themed-toggle-input";
import { MountainItemListAsTouchable } from "@/components/ui/molecules/mountain-item-list";
import { useMountainsSearch } from "@/domains/community-challenge/community-challenge.api";
import { useMountains } from "@/domains/mountain/mountain.api";
import { useImagePicker } from "@/hooks/use-image-picker";
import { cleanText } from "@/lib";
import { validateMountainForm } from "@/lib/mountain-validation";
import { MountainData, NewMountainData } from "@/types/mountain";

type Mode = "search" | "create";

type MountainListItem = MountainData & { isNew?: boolean };
type CreateNewItem = { id: "__create_new__"; name?: never };
type ListItem = MountainListItem | CreateNewItem;

function isMountainItem(item: ListItem): item is MountainListItem {
  return item.id !== "__create_new__";
}

// Re-export NewMountainData for backwards compatibility
export type { NewMountainData } from "@/types/mountain";

type MountainSelectionDrawerProps = {
  /** IDs of currently selected mountains */
  selectedIds: string[];
  /** Callback when selection changes */
  onSelectionChange: Dispatch<SetStateAction<string[]>>;
  /** Enable creating new mountains (for community challenges) */
  allowCreate?: boolean;
  /** New mountains created locally (not yet saved to server) */
  newMountains?: NewMountainData[];
  /** Callback when a new mountain is created locally */
  onAddNewMountain?: (mountain: NewMountainData) => void;
  /** Callback when a local mountain is removed */
  onRemoveNewMountain?: (tempId: string) => void;
};

export function MountainSelectionDrawer({
  selectedIds,
  onSelectionChange,
  allowCreate = false,
  newMountains = [],
  onAddNewMountain,
  onRemoveNewMountain,
}: MountainSelectionDrawerProps) {
  const intl = useIntl();
  const [mode, setMode] = useState<Mode>("search");
  const [query, setQuery] = useState("");
  const { data: mountainsData } = useMountains();

  // Global search for community challenge editing (when allowCreate is true and there's a query)
  const shouldUseGlobalSearch = allowCreate && query.trim().length > 0;
  const { data: searchData, isLoading: isSearching } = useMountainsSearch({
    query: shouldUseGlobalSearch ? query : undefined,
  });

  // Create mountain form state
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [height, setHeight] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [essential, setEssential] = useState(false);
  const {
    imageUri,
    imageBase64,
    pickImage,
    reset: resetImage,
  } = useImagePicker();

  const allMountains = useMemo(() => mountainsData ?? [], [mountainsData]);

  // Convert new mountains to display format
  const newMountainsForDisplay = useMemo(
    () =>
      newMountains.map((m) => ({
        id: m.tempId,
        name: m.name,
        slug: m.tempId, // Use tempId as slug for display
        location: m.location,
        height: String(m.height),
        latitude: String(m.latitude),
        longitude: String(m.longitude),
        imageUrl: m.imageUri ?? null,
        essential: m.essential,
        isNew: true, // Mark as new for special handling
      })),
    [newMountains],
  );

  const filteredMountains = useMemo(() => {
    // If using global search, use the search results
    if (shouldUseGlobalSearch && searchData?.pages) {
      const searchResults = searchData.pages.flatMap((page) => page.items);
      // Add new mountains at the top
      const mergedResults = [...newMountainsForDisplay, ...searchResults];
      // Sort selected mountains to the top (after new mountains)
      return mergedResults.sort((a, b) => {
        // New mountains always at top
        const aIsNew = "isNew" in a ? 0 : 1;
        const bIsNew = "isNew" in b ? 0 : 1;
        if (aIsNew !== bIsNew) return aIsNew - bIsNew;
        // Then selected mountains
        const aSelected = selectedIds.includes(a.id) ? 0 : 1;
        const bSelected = selectedIds.includes(b.id) ? 0 : 1;
        return aSelected - bSelected;
      });
    }

    // Otherwise filter from current challenge mountains
    const filtered = !query.trim()
      ? allMountains
      : allMountains.filter(({ name, location }) =>
          cleanText(`${name} ${location}`)
            .toLowerCase()
            .includes(cleanText(query).toLowerCase()),
        );

    // Add new mountains at the top
    const mergedFiltered = [...newMountainsForDisplay, ...filtered];

    // Sort selected mountains to the top (after new mountains)
    return mergedFiltered.sort((a, b) => {
      // New mountains always at top
      const aIsNew = "isNew" in a ? 0 : 1;
      const bIsNew = "isNew" in b ? 0 : 1;
      if (aIsNew !== bIsNew) return aIsNew - bIsNew;
      // Then selected mountains
      const aSelected = selectedIds.includes(a.id) ? 0 : 1;
      const bSelected = selectedIds.includes(b.id) ? 0 : 1;
      return aSelected - bSelected;
    });
  }, [
    query,
    allMountains,
    selectedIds,
    shouldUseGlobalSearch,
    searchData,
    newMountainsForDisplay,
  ]);

  const handleToggleMountain = (
    mountainId: string,
    isNewMountain?: boolean,
  ) => {
    // If it's a new mountain being deselected, remove it from newMountains
    if (isNewMountain && onRemoveNewMountain) {
      onRemoveNewMountain(mountainId);
      return;
    }

    const isSelected = selectedIds.includes(mountainId);
    onSelectionChange((prev) =>
      isSelected
        ? prev.filter((id) => id !== mountainId)
        : [...prev, mountainId],
    );
  };

  const handleCreateNew = () => {
    if (!onAddNewMountain) return;

    const validation = validateMountainForm(
      { name, location, height, latitude, longitude },
      intl,
    );
    if (!validation.valid) {
      return Alert.alert(validation.error);
    }

    if (!imageBase64) {
      return Alert.alert(
        intl.formatMessage({ defaultMessage: "Image is required" }),
      );
    }

    // Generate a temporary ID for local tracking
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    onAddNewMountain({
      tempId,
      name: validation.data.name,
      location: validation.data.location,
      height: validation.data.height,
      latitude: validation.data.latitude,
      longitude: validation.data.longitude,
      essential,
      image: imageBase64,
      imageUri: imageUri ?? undefined,
    });

    Alert.alert(intl.formatMessage({ defaultMessage: "Mountain added!" }));

    // Reset form
    resetForm();
    setMode("search");
  };

  const resetForm = () => {
    setName("");
    setLocation("");
    setHeight("");
    setLatitude("");
    setLongitude("");
    setEssential(false);
    resetImage();
  };

  if (mode === "create" && allowCreate) {
    return (
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <View className="max-h-[80vh] min-h-[80vh] bg-background p-6">
          <View className="mb-4">
            <ThemedText className="text-2xl font-semibold">
              <FormattedMessage defaultMessage="Create mountain" />
            </ThemedText>
          </View>

          <View className="flex-1 gap-4">
            {/* Image picker */}
            <View className="flex-row items-end gap-4">
              <TouchableOpacity
                onPress={pickImage}
                className="h-[58px] w-[58px] items-center justify-center overflow-hidden rounded border-2 border-border bg-muted/30"
              >
                {imageUri ? (
                  <Image
                    source={{ uri: imageUri }}
                    className="size-full"
                    resizeMode="cover"
                  />
                ) : (
                  <LucideIcon icon={Camera} size={24} muted />
                )}
              </TouchableOpacity>
              <View className="flex-1">
                <ThemedTextInput
                  label={intl.formatMessage({
                    defaultMessage: "Mountain name",
                  })}
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            <ThemedTextInput
              label={intl.formatMessage({ defaultMessage: "Location" })}
              value={location}
              onChangeText={setLocation}
            />

            <ThemedTextInput
              label={intl.formatMessage({ defaultMessage: "Height (meters)" })}
              value={height}
              onChangeText={setHeight}
              keyboardType="numeric"
            />

            <View className="flex-row gap-4">
              <View className="flex-1">
                <ThemedTextInput
                  label={intl.formatMessage({ defaultMessage: "Latitude" })}
                  value={latitude}
                  onChangeText={setLatitude}
                  keyboardType="numeric"
                />
              </View>
              <View className="flex-1">
                <ThemedTextInput
                  label={intl.formatMessage({ defaultMessage: "Longitude" })}
                  value={longitude}
                  onChangeText={setLongitude}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <ThemedToggleInput
              label={intl.formatMessage({ defaultMessage: "Essential" })}
              checked={essential}
              onChecked={setEssential}
            />
          </View>

          <View className="mt-4 gap-2">
            <Button onPress={handleCreateNew}>
              <FormattedMessage defaultMessage="Add mountain" />
            </Button>
            <Button
              intent="ghost"
              onPress={() => {
                resetForm();
                setMode("search");
              }}
              textClassName="text-muted-foreground"
            >
              <FormattedMessage defaultMessage="Back" />
            </Button>
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  // Add a "create new" item at the end of the list when allowCreate is enabled
  const createNewItem: CreateNewItem = { id: "__create_new__" };
  const listData: ListItem[] = allowCreate
    ? [...filteredMountains, createNewItem]
    : filteredMountains;

  return (
    <View className="max-h-[70vh] min-h-[70vh] bg-background p-6">
      <View className="mb-2 flex-row items-center justify-between">
        <ThemedText className="text-2xl font-semibold">
          <FormattedMessage defaultMessage="Mountains" />
        </ThemedText>
        {allowCreate && (
          <TouchableOpacity
            onPress={() => setMode("create")}
            className="flex-row items-center gap-1"
          >
            <ThemedText className="text-muted-foreground">
              <FormattedMessage defaultMessage="Create new" />
            </ThemedText>
            <LucideIcon icon={Plus} size={14} muted />
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={listData}
        keyExtractor={(m) => m.id}
        initialNumToRender={10}
        stickyHeaderIndices={[0]}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <ThemedView className="z-20 pb-2">
            <SearchInput onChangeText={(text) => setQuery(text)} />
            {shouldUseGlobalSearch && (
              <View className="mt-2 flex-row items-center gap-2">
                {isSearching ? (
                  <ActivityIndicator size="sm" />
                ) : (
                  <LucideIcon icon={Globe} size={14} muted />
                )}
                <ThemedText className="text-xs text-muted-foreground">
                  <FormattedMessage defaultMessage="Searching all mountains" />
                </ThemedText>
              </View>
            )}
          </ThemedView>
        }
        renderItem={({ item }) => {
          // Render "Create new" item at the bottom
          if (!isMountainItem(item)) {
            return (
              <TouchableOpacity
                onPress={() => setMode("create")}
                className="flex-row items-center gap-4 py-2"
              >
                <View
                  className="items-center justify-center rounded-md border-2 border-dashed border-border bg-muted/30"
                  style={{ width: 100, height: 100 }}
                >
                  <LucideIcon icon={Plus} size={32} muted />
                </View>
                <View className="flex-1">
                  <ThemedText className="text-lg font-semibold">
                    <FormattedMessage defaultMessage="New" />
                  </ThemedText>
                  <ThemedText className="text-muted-foreground">
                    <FormattedMessage defaultMessage="Add a new mountain" />
                  </ThemedText>
                </View>
              </TouchableOpacity>
            );
          }

          const isNewMountain = item.isNew === true;
          const isSelected = isNewMountain || selectedIds.includes(item.id);
          return (
            <View className="relative py-2">
              <MountainItemListAsTouchable
                onPress={() => handleToggleMountain(item.id, isNewMountain)}
                name={item.name}
                location={item.location}
                imageUrl={item.imageUrl}
                essential={item.essential}
                latitude={item.latitude}
                longitude={item.longitude}
                slug={item.slug}
                height={item.height}
              />
              {isSelected && (
                <View
                  className={`pointer-events-none absolute left-0 top-2 items-center justify-center ${isNewMountain ? "bg-green-500" : "bg-blue-500"}`}
                  style={{ width: 100, height: 100, borderRadius: 6 }}
                >
                  <LucideIcon
                    icon={isNewMountain ? Sparkles : Check}
                    size={32}
                    color="white"
                  />
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}
