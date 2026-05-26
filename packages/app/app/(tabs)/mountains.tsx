import {
  Redirect,
  useIsFocused,
  useLocalSearchParams,
} from "expo-router";
import {
  ArrowDownUp,
  Baby,
  ChevronUp,
  CircleDashed,
  CircleDot,
  Dog,
  List,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  Mountain,
  SearchX,
  SlidersHorizontal,
  TrendingDown,
  TriangleAlert,
} from "lucide-react-native";
import { useMemo, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { FlatList, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { twMerge } from "tailwind-merge";


import { useAuth } from "@/components/providers/auth-provider";
import {
  LucideIcon,
  SearchInput,
  ThemedText,
  ThemedView,
  tierColor,
} from "@/components/ui/atoms";
import {
  MountainItemList,
  MountainPreviewCard,
  SettingsFilterModal,
  type SettingsGroup,
} from "@/components/ui/molecules";
import { Colors } from "@/constants/colors";
import {
  MountainsMap,
  type MountainPreview,
  type MountainsMapControl,
} from "@/domains/mountain/components/mountains-map";
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

type FilterType = "list" | "essentials";

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

// NativeTabs eagerly mounts sibling tab screens at app launch — so this
// component renders before the user has even visited Mountains. We split
// the screen into two branches so the unauth path doesn't accidentally fire
// any protected hooks (or a Redirect) while the tab is just sitting in the
// background.
export default function MountainsScreen() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <RedirectMountainsScreen />;
  return <AuthedMountainsScreen />;
}

// Unauth branch: render nothing until the tab is actually focused, then
// redirect. Firing the Redirect while mounted-but-unfocused would yank an
// unauth user from Home over to /join. NativeTabs eagerly mounts sibling
// tabs, so we need react-navigation's `useIsFocused` (real focus state) —
// segment-based detection always reports false for non-root tabs.
function RedirectMountainsScreen() {
  const isFocused = useIsFocused();
  if (!isFocused) return null;
  return <Redirect href="/join" />;
}

function AuthedMountainsScreen() {
  const intl = useIntl();
  const { view } = useLocalSearchParams<{ view?: string }>();
  const { data, isPending } = useMountains();
  const [query, setQuery] = useState("");
  // Initial view derived from the URL param so a `?view=list` deep-link
  // doesn't briefly mount the heavyweight MapView before an effect corrects
  // it. The legacy `?view=map` value is now redundant — map is the default.
  const startsAsList = view === "list";
  const [filtersSelected, setFiltersSelected] = useState<FilterType[]>(() =>
    startsAsList ? ["list"] : [],
  );
  const { data: userSummits } = useUserChallengeSummits();
  // Read-only: the permission prompt lives in the root `LocationSync` so
  // every authenticated screen sees the same already-resolved location
  // without re-triggering the OS dialog.
  const { location: userLocation } = useLocation();
  // Don't pre-select "closest-first" when the map is the default view: that
  // filter is disabled in map mode (see `disabled: isMapView`), so the chip
  // would render as already-selected AND greyed-out on first launch.
  const [settingsFilters, setSettingsFilters] = useState<SettingsFilter[]>(
    startsAsList ? ["closest-first"] : [],
  );

  const isMapView = !filtersSelected.includes("list");
  const viewMode = isMapView ? "map" : "list";

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

  const handleFiltersChange = (newFilters: FilterType[]) => {
    setFiltersSelected(newFilters);
  };

  const filters = useMemo(
    () => [
      {
        type: "essentials" as const,
        name: intl.formatMessage({ defaultMessage: "Essentials" }),
        showDot: true,
      },
      // The view-toggle chip reads as the destination, not the current state:
      // in map mode it says "List" (tap to switch), in list mode it says
      // "Map" (tap to switch back). Single chip toggles `filtersSelected`'s
      // "list" entry, which drives `isMapView`.
      {
        type: "list" as const,
        name: isMapView
          ? intl.formatMessage({ defaultMessage: "List" })
          : intl.formatMessage({ defaultMessage: "Map" }),
        icon: isMapView ? List : MapIcon,
      },
    ],
    [intl, isMapView],
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
    } else if (
      settingsFilters.includes("closest-first") &&
      !userLocation
    ) {
      // closest-first picked but no location fix yet — fall back to a sensible
      // default (height descending) so the list isn't in arbitrary server
      // order. The user can re-tap closest-first once location resolves.
      filtered = filtered.sort(
        (a, b) => parseInt(b.height, 10) - parseInt(a.height, 10),
      );
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

  const [showSettings, setShowSettings] = useState(false);
  // Preview state lives in the screen (not inside MountainsMap) so the card
  // can be rendered as the final overlay — above the chip cluster — without
  // a z-index fight inside the map's stacking context.
  const [preview, setPreview] = useState<MountainPreview | null>(null);
  const insets = useSafeAreaInsets();
  // Imperative handle into MountainsMap so the recenter button — rendered in
  // the screen-level bottom-right cluster, not inside the map — can drive
  // the camera. Stays null until the map mounts.
  const mapControlRef = useRef<MountainsMapControl | null>(null);

  return (
    <ThemedView className="flex-1">
      {/* In map mode the bar floats over the map (absolute + transparent) so
          the map fills the full screen. In list mode the bar sits in normal
          flow with the themed background, so the list content scrolls below
          it. */}
      <View
        style={{ paddingTop: insets.top + 8 }}
        className={twMerge(
          "z-10 gap-2 px-4 pb-2",
          isMapView
            ? "absolute inset-x-0 top-0"
            : "bg-background",
        )}
      >
        {/* Row 1: search + Filters button on the same row, matched heights via
            `py-4 + border-2` so they line up exactly. The search gets a solid
            background since in map mode this whole bar is transparent and the
            input would otherwise read as floating glyphs over terrain. */}
        <View className="flex-row items-center gap-2">
          <View className="flex-1">
            <SearchInput
              onChangeText={setQuery}
              inputClassName="bg-background"
            />
          </View>
          <Pressable
            onPress={() => setShowSettings(true)}
            className={twMerge(
              "flex-row items-center gap-1.5 rounded border-2 px-3 py-4",
              settingsFilters.length > 0
                ? "border-primary bg-primary"
                : "border-border bg-background",
            )}
            accessibilityLabel={intl.formatMessage({
              defaultMessage: "Filters",
            })}
          >
            <LucideIcon
              icon={SlidersHorizontal}
              size={20}
              color={settingsFilters.length > 0 ? "white" : undefined}
            />
            <ThemedText
              className={twMerge(
                "font-medium",
                settingsFilters.length > 0 && "text-white",
              )}
            >
              <FormattedMessage defaultMessage="Filters" />
            </ThemedText>
            {settingsFilters.length > 0 && (
              <View className="ml-0.5 size-5 items-center justify-center rounded-full bg-white">
                <ThemedText className="text-xs font-bold text-primary">
                  {settingsFilters.length}
                </ThemedText>
              </View>
            )}
          </Pressable>
        </View>

      </View>

      {/* Floating bottom-right cluster — visible in both modes so the user
          can flip back and forth. In map mode the recenter button stacks
          above the chips, aligned to the right edge so it sits over the
          view-toggle chip. */}
      <View
        style={{ bottom: insets.bottom + 16 }}
        className="absolute right-4 z-10 items-end gap-2"
      >
        {isMapView && userLocation && (
          <Pressable
            onPress={() => mapControlRef.current?.recenterOnUser()}
            className="size-11 items-center justify-center rounded-full border-2 border-border bg-background"
            accessibilityLabel={intl.formatMessage({
              defaultMessage: "Center map on my location",
            })}
          >
            <LucideIcon icon={LocateFixed} size={18} />
          </Pressable>
        )}
        <View className="flex-row gap-2">
          {filters.map(({ type, name, showDot, icon }) => {
            // The view-toggle chip ("list") is not a filter — it always
            // renders in the neutral chip style and just relabels itself.
            // Only real filters (Essentials) flip to the primary style when
            // active.
            const isViewToggle = type === "list";
            const isSelected = filtersSelected.includes(type);
            const showActiveStyle = isSelected && !isViewToggle;
            return (
              <Pressable
                key={type}
                onPress={() => handleFiltersChange(
                  isSelected
                    ? filtersSelected.filter((f) => f !== type)
                    : [...filtersSelected, type],
                )}
                className={twMerge(
                  "flex-row items-center gap-1 rounded border-2 px-3 py-3",
                  showActiveStyle
                    ? "border-primary bg-primary"
                    : "border-border bg-background",
                )}
              >
                {showDot && (
                  <LucideIcon
                    icon={CircleDot}
                    size={16}
                    color={showActiveStyle ? "white" : undefined}
                    primary={!showActiveStyle}
                  />
                )}
                {icon && (
                  <LucideIcon
                    icon={icon}
                    size={16}
                    color={showActiveStyle ? "white" : undefined}
                  />
                )}
                <ThemedText
                  className={twMerge(
                    "font-medium",
                    showActiveStyle && "text-white",
                  )}
                >
                  {name}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <SettingsFilterModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        groups={settingsGroups}
        selected={settingsFilters}
        onChange={setSettingsFilters}
      />

      {/* Keep both views mounted across mode switches so MountainsMap doesn't
          tear down its native Mapbox view (which would lose camera state).
          Toggling visibility with `display:none` collapses the view to 0×0,
          which Mapbox interprets as a viewport resize on re-show — that
          ends up zooming to max. Instead, both views render at full size
          and we layer them with `zIndex`; the inactive view stays alive
          AND keeps its real bounds. `pointerEvents=none` on the inactive
          view stops it from intercepting taps. */}
      <View className="flex-1">
        <View
          style={[
            ABSOLUTE_FILL,
            { zIndex: viewMode === "list" ? 1 : 0 },
          ]}
          pointerEvents={viewMode === "list" ? "auto" : "none"}
        >
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
                        prev.filter((f) => f === "list"),
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
        </View>
        <View
          style={[
            ABSOLUTE_FILL,
            {
              zIndex: viewMode === "map" ? 1 : 0,
              // Fade the map behind the list so it reads as background
              // context, not competing content. Still visible enough that
              // you can see roughly where the listed peaks are.
              opacity: viewMode === "map" ? 1 : 0.1,
            },
          ]}
          pointerEvents={viewMode === "map" ? "auto" : "none"}
        >
          <MountainsMap
            mountains={filteredMountains || []}
            summitedSlugs={summitedSlugs}
            userLocation={userLocation}
            isLoading={isPending}
            controlRef={mapControlRef}
            onPreviewChange={setPreview}
          />
        </View>
      </View>

      {/* Preview card mounts as the LAST overlay so it paints on top of the
          chip cluster (z-10) and the recenter button. Marker taps inside
          MountainsMap call back into setPreview here. */}
      <MountainPreviewCard
        preview={preview}
        onClose={() => setPreview(null)}
      />
    </ThemedView>
  );
}

const ABSOLUTE_FILL = {
  position: "absolute" as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};
