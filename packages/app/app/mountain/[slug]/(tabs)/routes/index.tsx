import * as Linking from "expo-linking";
import { Redirect, useGlobalSearchParams, useRouter } from "expo-router";
import {
  ArrowDownAZ,
  ChevronRight,
  Clock,
  Layers,
  Repeat,
  Route as RouteIcon,
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { FlatList, ScrollView, TouchableOpacity, View } from "react-native";
import { twMerge } from "tailwind-merge";

import { useAuth } from "@/components/providers/auth-provider";
import { ExternalSourceIcon } from "@/components/route/external-source-icon";
import {
  LucideIcon,
  SearchInput,
  ThemedText,
  ThemedView,
} from "@/components/ui/atoms";
import {
  BlurredScreenHeader,
  useBlurredScreenHeaderHeight,
} from "@/components/ui/molecules";
import { RouteListItem } from "@/components/ui/molecules/route-list-item";
import { useMountainOne } from "@/domains/mountain/mountain.api";
import { useRoutesForMountain } from "@/domains/route/route.api";
import { isLoopRoute, pickLocalizedTitle } from "@/domains/route/route.format";

import type { MountainRoute } from "@/domains/route/route.types";

// Use DB id when present (always, for API-sourced routes); fall back to
// externalId only for legacy file-based routes during the transition.
const keyExtractor = (route: MountainRoute) => route.id ?? route.externalId;

// Sort options run mutually-exclusive (one selected at a time, like /challenges
// pills). "Default" preserves the scraper's Wikiloc-rank ordering so the user
// can reset.
type Sort = "default" | "shortest" | "longest" | "duration";

type ActiveSort = Exclude<Sort, "default">;

// Comparator factory that buckets nulls in a chosen direction. Returning
// `Infinity`/`-Infinity` from the key extractor would make `Infinity - Infinity`
// a NaN comparator on routes with both keys missing, which is implementation-
// defined sort order; an explicit null-bucket avoids that.
const compareBy =
  <T,>(
    extract: (item: T) => number | null,
    direction: "asc" | "desc",
  ) =>
  (a: T, b: T): number => {
    const av = extract(a);
    const bv = extract(b);
    if (av === null && bv === null) return 0;
    // Missing values always sink to the end, regardless of direction.
    if (av === null) return 1;
    if (bv === null) return -1;
    return direction === "asc" ? av - bv : bv - av;
  };

const durationOf = (r: MountainRoute): number | null =>
  r.movingTimeSeconds ?? r.totalTimeSeconds;

const SORT_COMPARATORS: Record<ActiveSort, (a: MountainRoute, b: MountainRoute) => number> = {
  shortest: compareBy((r) => r.distanceMeters, "asc"),
  longest: compareBy((r) => r.distanceMeters, "desc"),
  duration: compareBy(durationOf, "desc"),
};

export default function MountainRoutesScreen() {
  const intl = useIntl();
  const router = useRouter();
  // useGlobalSearchParams — see comment in summit.tsx + the app skill's
  // "NativeTabs gotchas" section.
  const { slug } = useGlobalSearchParams<{ slug: string }>();
  // Routes data is gated to authenticated users (the underlying endpoint
  // lives under /api/protected/routes). Mirror the summit-tab pattern: if
  // the user isn't signed in, redirect to the join screen instead of
  // letting the unauthenticated query fire and 401.
  const { isAuthenticated } = useAuth();
  const { data: mountain } = useMountainOne({ mountainSlug: slug });
  const { data: routesData, isLoading: routesLoading } =
    useRoutesForMountain(isAuthenticated ? slug : undefined);
  // Memoise the fallback so the useMemo on visibleRoutes has a stable
  // routes reference between renders when the query is loading.
  const routes = useMemo(() => routesData ?? [], [routesData]);
  const headerHeight = useBlurredScreenHeaderHeight();

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  // Loop is an independent toggle filter (not a sort), so it lives in its own
  // boolean state. Sorts are mutually-exclusive among themselves.
  const [loopOnly, setLoopOnly] = useState(false);
  // Multi-peak filter: only show routes that summit more than one mountain.
  // Useful when a hiker specifically wants "2x100 Cims"-style traverses.
  const [multiPeakOnly, setMultiPeakOnly] = useState(false);
  // Default to "shortest" — for a list of routes up the same mountain, the
  // shortest one is the most useful first impression (lowest barrier to
  // entry). Users can toggle Shortest off to fall back to scraper order.
  const [sort, setSort] = useState<Sort>("shortest");

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  const visibleRoutes = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    let result = routes;
    if (loopOnly) {
      result = result.filter((r) => isLoopRoute(r));
    }
    if (multiPeakOnly) {
      result = result.filter((r) => (r.mountains?.length ?? 0) > 1);
    }
    if (q) {
      result = result.filter((r) => {
        const localized = pickLocalizedTitle(r, intl).toLowerCase();
        return (
          localized.includes(q) || r.titleRaw.toLowerCase().includes(q)
        );
      });
    }
    if (sort === "default") return result;
    return [...result].sort(SORT_COMPARATORS[sort]);
  }, [routes, debouncedSearch, loopOnly, multiPeakOnly, sort, intl]);

  const sortPills: { value: Sort; label: string; icon: typeof RouteIcon }[] = [
    {
      value: "shortest",
      label: intl.formatMessage({ defaultMessage: "Shortest" }),
      icon: RouteIcon,
    },
    {
      value: "longest",
      label: intl.formatMessage({ defaultMessage: "Longest" }),
      icon: RouteIcon,
    },
    {
      value: "duration",
      label: intl.formatMessage({ defaultMessage: "Duration" }),
      icon: Clock,
    },
  ];

  // Tabs mount eagerly; auth state may still be resolving on the first
  // frame. Once we know the user isn't signed in, push them to /join.
  if (!isAuthenticated) {
    return <Redirect href="/join" />;
  }

  return (
    <ThemedView className="flex-1">
      <BlurredScreenHeader>{mountain?.name ?? ""}</BlurredScreenHeader>
      <View className="gap-3 pb-3" style={{ paddingTop: headerHeight }}>
        <View className="px-4">
          <SearchInput onChangeText={setSearchInput} />
        </View>
        {/* One scrollable row of pills. flex-wrap previously broke them onto
            multiple lines on narrow screens; horizontal scroll keeps the row
            visually tight and matches the /challenges pattern at higher
            density. `keyboardShouldPersistTaps="handled"` so tapping a pill
            with the SearchInput focused doesn't first dismiss the keyboard. */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          keyboardShouldPersistTaps="handled"
        >
          <Pill
            label={intl.formatMessage({ defaultMessage: "Circular" })}
            icon={Repeat}
            active={loopOnly}
            onPress={() => setLoopOnly((v) => !v)}
          />
          <Pill
            label={intl.formatMessage({ defaultMessage: "Multi-peak" })}
            icon={Layers}
            active={multiPeakOnly}
            onPress={() => setMultiPeakOnly((v) => !v)}
          />
          {sortPills.map((pill) => (
            <Pill
              key={pill.value}
              label={pill.label}
              icon={pill.icon}
              activeIcon={ArrowDownAZ}
              active={sort === pill.value}
              onPress={() =>
                setSort((current) =>
                  current === pill.value ? "default" : pill.value,
                )
              }
            />
          ))}
        </ScrollView>
      </View>
      <FlatList
        data={visibleRoutes}
        keyExtractor={keyExtractor}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 4,
          paddingBottom: 96,
        }}
        ListEmptyComponent={
          // While loading we still want to say so. For "no routes for this
          // mountain at all" we render nothing — the Wikiloc footer below
          // becomes the action surface. The "no matches" copy only fires
          // when the user has actually narrowed the visible set with a
          // search/loop/multi-peak filter.
          routesLoading ? (
            <View className="items-center px-6 py-16">
              <ThemedText className="text-center text-base font-medium text-muted-foreground">
                <FormattedMessage defaultMessage="Loading…" />
              </ThemedText>
            </View>
          ) : routes.length > 0 ? (
            <View className="items-center px-6 py-16">
              <ThemedText className="text-center text-base font-medium text-muted-foreground">
                <FormattedMessage defaultMessage="No routes match your filters" />
              </ThemedText>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <RouteListItem
            route={item}
            onPress={() => {
              // useGlobalSearchParams can return undefined for a frame under
              // NativeTabs eager-mount; don't navigate to /mountain// if so.
              if (!slug) return;
              router.push({
                pathname: "/mountain/[slug]/routes/[routeId]",
                params: { slug, routeId: item.id ?? item.externalId },
              });
            }}
          />
        )}
        ListFooterComponent={
          mountain ? (
            <ViewMoreOnWikiloc mountainName={mountain.name} mountainLocation={mountain.location} intlLocale={intl.locale} />
          ) : null
        }
      />
    </ThemedView>
  );
}

// Footer row that mirrors RouteListItem's 80×80 image-left layout but with
// the Wikiloc badge as the "thumbnail" and a "View more on Wikiloc" label.
// Tapping it opens the same Wikiloc map search the mountain detail's
// "View on wikiloc" action uses, so the search is keyed by mountain name +
// location and respects the user's locale (ca/es subdomain when set).
const ViewMoreOnWikiloc = ({
  mountainName,
  mountainLocation,
  intlLocale,
}: {
  mountainName: string;
  mountainLocation: string;
  intlLocale: string;
}) => {
  const onPress = () => {
    const lang = intlLocale.split(/[-_]/)[0];
    const subdomain = lang === "ca" || lang === "es" ? lang : "en";
    const url =
      `https://${subdomain}.wikiloc.com/wikiloc/map.do` +
      `?q=${encodeURIComponent(`${mountainName}, ${mountainLocation}`)}` +
      `&fitMapToTrails=1&page=1`;
    void Linking.openURL(url);
  };
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="mb-3 flex-row items-center gap-3"
    >
      <View className="size-20 items-center justify-center overflow-hidden rounded border border-border bg-muted">
        <ExternalSourceIcon source="wikiloc" size={48} />
      </View>
      <View className="flex-1 flex-row items-center justify-between gap-2">
        <View className="flex-1">
          <ThemedText
            numberOfLines={2}
            className="font-medium leading-snug"
          >
            <FormattedMessage defaultMessage="View more on Wikiloc" />
          </ThemedText>
        </View>
        <LucideIcon icon={ChevronRight} size={18} muted />
      </View>
    </TouchableOpacity>
  );
};

type PillProps = {
  label: string;
  icon: typeof RouteIcon;
  /** Optional alternate icon shown only when the pill is active. Sort pills
   *  use ArrowDownAZ to signal "now sorting by this"; filter pills don't. */
  activeIcon?: typeof RouteIcon;
  active: boolean;
  onPress: () => void;
};

const Pill = ({ label, icon, activeIcon, active, onPress }: PillProps) => (
  <TouchableOpacity
    onPress={onPress}
    className={twMerge(
      "flex-row items-center gap-1.5 rounded-full border-2 px-3 py-1.5",
      active ? "border-primary bg-primary/10" : "border-border",
    )}
  >
    <LucideIcon
      icon={active && activeIcon ? activeIcon : icon}
      size={14}
      muted={!active}
      primary={active}
    />
    <ThemedText
      className={twMerge(
        "text-sm font-medium",
        active ? "text-primary" : "text-muted-foreground",
      )}
    >
      {label}
    </ThemedText>
  </TouchableOpacity>
);
