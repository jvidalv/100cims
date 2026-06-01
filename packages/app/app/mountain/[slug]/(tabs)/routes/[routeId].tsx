import * as Linking from "expo-linking";
import { Redirect, useGlobalSearchParams, useRouter } from "expo-router";
import {
  Bookmark,
  BookmarkCheck,
  Car,
  Clock,
  Hourglass,
  Lock,
  LockOpen,
  Mountain,
  Repeat,
  Route as RouteIcon,
  Share as ShareIcon,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
} from "lucide-react-native";
import { useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  Alert,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";

import { useAuth } from "@/components/providers/auth-provider";
import { ExternalSourceIcon } from "@/components/route/external-source-icon";
import { RouteElevationChart } from "@/components/route/route-elevation-chart";
import { RouteMap } from "@/components/route/route-map";
import {
  LucideIcon,
  Skeleton,
  ThemedText,
  ThemedView,
  tierColor,
} from "@/components/ui/atoms";
import {
  ActionRow,
  BlurredScreenHeader,
  MountainRowMinimal,
  useBlurredScreenHeaderHeight,
} from "@/components/ui/molecules";
import { useMountainOne } from "@/domains/mountain/mountain.api";
import { useRouteById } from "@/domains/route/route.api";
import {
  difficultyPosition,
  formatDifficulty,
  formatDuration,
  formatKm,
  formatMeters,
  isLoopRoute,
  pickLocalizedDescription,
  pickLocalizedTitle,
} from "@/domains/route/route.format";
import {
  useIsRouteSaved,
  useSavedRouteAddMutation,
  useSavedRouteRemoveMutation,
} from "@/domains/saved/saved-routes.api";
import { shareDeeplink } from "@/lib/share";

import type { TrailType } from "@/domains/route/route.types";
import type { MountainData } from "@/types/mountain";
import type { LucideIcon as LucideIconType } from "lucide-react-native";

export default function RouteDetailScreen() {
  const intl = useIntl();
  const router = useRouter();
  // NativeTabs eager-mounts sibling screens, so useGlobalSearchParams can
  // return undefined params even when the URL is fully formed; the public
  // hook signature lies and types them as `string`. Narrow to optional and
  // pass undefined through — both downstream hooks already short-circuit
  // when their key is undefined (`useMountainOne` via `enabled: Boolean(mountainSlug)`,
  // `useRouteById` via explicit `undefined` arg).
  const { slug, routeId } = useGlobalSearchParams<{
    slug?: string;
    routeId?: string;
  }>();
  // Routes data is gated to authenticated users (the underlying endpoint
  // lives under /api/protected/routes). Skip the fetch when signed out so
  // it doesn't 401.
  const { isAuthenticated } = useAuth();
  // Header anchors on the parent mountain, not the route — matches the
  // routes-tab list screen and gives back-navigation visual continuity.
  const { data: mountain } = useMountainOne({ mountainSlug: slug ?? "" });
  const { data: route, isLoading } = useRouteById(
    isAuthenticated ? routeId : undefined,
  );
  const headerHeight = useBlurredScreenHeaderHeight();

  // Save/unsave bookmarks mirror the mountain-detail save flow. The
  // `useIsRouteSaved` hook reads the saved-routes query cache so it stays
  // in sync with the saved-routes screen without a separate per-route fetch.
  const isSaved = useIsRouteSaved(route?.id);
  const savedAddMutation = useSavedRouteAddMutation();
  const savedRemoveMutation = useSavedRouteRemoveMutation();
  // Map starts locked: an overlay above the MapView absorbs touches so a
  // tap or short drag scrolls the parent ScrollView normally. Long-press
  // unlocks it. This sidesteps the common "I tried to scroll the page but
  // the map captured my pan" problem on embedded maps.
  const [mapUnlocked, setMapUnlocked] = useState(false);
  // Description collapses to its first paragraph by default. Wikiloc bodies
  // are commonly 1–2KB of author prose and would otherwise push the rest of
  // the screen far below the fold. Splitting on the first blank line keeps
  // a complete thought above the fold instead of slicing mid-sentence at an
  // arbitrary line count.
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  if (!isAuthenticated) {
    return <Redirect href="/join" />;
  }

  if (!route) {
    return (
      <ThemedView className="flex-1">
        <BlurredScreenHeader>
          {mountain?.name ??
            intl.formatMessage({ defaultMessage: "Route" })}
        </BlurredScreenHeader>
        {isLoading ? (
          <RouteDetailSkeleton headerHeight={headerHeight} />
        ) : (
          <View
            className="flex-1 items-center justify-center px-6"
            style={{ paddingTop: headerHeight }}
          >
            <ThemedText className="text-center text-muted-foreground">
              <FormattedMessage defaultMessage="Route not found." />
            </ThemedText>
          </View>
        )}
      </ThemedView>
    );
  }

  const title = pickLocalizedTitle(route, intl);
  const description = pickLocalizedDescription(route, intl);
  // If Wikiloc gave us a trailType use it, otherwise infer loop from geometry.
  const effectiveType: TrailType | null =
    route.trailType ?? (isLoopRoute(route) ? "loop" : null);
  const isLoop = effectiveType === "loop";

  const handleToggleSaved = () => {
    if (!route.id) return;
    if (isSaved) {
      savedRemoveMutation.mutate({ routeId: route.id });
      return;
    }
    savedAddMutation.mutate({ routeId: route.id });
    Alert.alert(
      intl.formatMessage({ defaultMessage: "Saved for later" }),
      intl.formatMessage(
        { defaultMessage: "{name} is on your saved routes list." },
        { name: title },
      ),
      [
        {
          text: intl.formatMessage({ defaultMessage: "OK" }),
          style: "cancel",
        },
        {
          text: intl.formatMessage({ defaultMessage: "View saved" }),
          onPress: () => router.push("/user/saved-routes"),
        },
      ],
    );
  };

  const handleShare = async (): Promise<void> => {
    if (!slug) return;
    // Share the DB id (when present); the detail screen + /one endpoint
    // both look up by uuid. External id is a Wikiloc identifier that the
    // server can't resolve.
    const routeIdentifier = route.id ?? route.externalId;
    await shareDeeplink({
      intl,
      path: `mountain/${slug}/routes/${routeIdentifier}`,
      messages: {
        en: `🥾 Check out this route up ${title} on cims!`,
        es: `🥾 Mira esta ruta ${title} en cims!`,
        ca: `🥾 Mira aquesta ruta ${title} a cims!`,
      },
    });
  };

  // Stat tiles are grouped into three semantic rows:
  //   row 1 — trail shape (loop/not) + difficulty (colour-coded chip)
  //   row 2 — vertical profile: gain, loss, peak
  //   row 3 — distances + times: distance, moving time, total time
  // Each row is its own flex-wrap so masonry breaks happen within a row,
  // not across rows — keeps the visual hierarchy intact.
  //
  // Tapping any tile pops an Alert explaining what the value is (helpful
  // for the subtle ones: moving vs total time, gain vs peak elevation).
  const row1: StatTileProps[] = [];
  if (effectiveType) {
    // Loops read as "low friction" (return to your car); non-loops mean a
    // shuttle or backtrack, so orange-tint the label to set expectations.
    // Same orange as the moderate difficulty tier for visual consistency.
    const trailShapeTint = effectiveType === "loop" ? undefined : "#f59e0b";
    row1.push({
      icon: iconForTrailType(effectiveType),
      label: formatTrailTypeLabel(effectiveType, intl) ?? "—",
      tint: trailShapeTint,
      info: {
        title: intl.formatMessage({ defaultMessage: "Trail shape" }),
        body: isLoop
          ? intl.formatMessage({
              defaultMessage:
                "The trail starts and ends at the same point. You return on a different path.",
            })
          : effectiveType === "out-and-back"
            ? intl.formatMessage({
                defaultMessage:
                  "Reach the summit then come back the same way.",
              })
            : intl.formatMessage({
                defaultMessage:
                  "Start and finish at different points. Plan transport accordingly.",
              }),
      },
    });
  }
  const difficultyLabel = formatDifficulty(route.technicalDifficulty, intl);
  if (route.technicalDifficulty && difficultyLabel) {
    // Same 5-tier red→orange→green gradient the mountain detail uses for
    // crowd-sourced difficulty (TriangleAlert icon, tinted background).
    const position = difficultyPosition(route.technicalDifficulty);
    const color = tierColor(position, 5, true);
    row1.push({
      icon: TriangleAlert,
      tint: color,
      label: difficultyLabel,
      info: {
        title: intl.formatMessage({ defaultMessage: "Difficulty" }),
        body: intl.formatMessage({
          defaultMessage:
            "Technical difficulty reported by the author — accounts for terrain, exposure, and any tricky sections.",
        }),
      },
    });
  }

  const row2: StatTileProps[] = [];
  if (route.elevationGainMeters !== null) {
    row2.push({
      icon: TrendingUp,
      label: formatMeters(route.elevationGainMeters) ?? "—",
      info: {
        title: intl.formatMessage({ defaultMessage: "Elevation gain" }),
        body: intl.formatMessage({
          defaultMessage:
            "Total metres climbed across the whole route. Includes every up — small descents and re-climbs add to it.",
        }),
      },
    });
  }
  if (route.elevationLossMeters !== null) {
    row2.push({
      icon: TrendingDown,
      label: formatMeters(route.elevationLossMeters) ?? "—",
      info: {
        title: intl.formatMessage({ defaultMessage: "Elevation loss" }),
        body: intl.formatMessage({
          defaultMessage:
            "Total metres descended. On a loop it equals the gain; on a one-way trail it can differ.",
        }),
      },
    });
  }
  if (route.maxElevationMeters !== null) {
    row2.push({
      icon: Mountain,
      label: formatMeters(route.maxElevationMeters) ?? "—",
      info: {
        title: intl.formatMessage({ defaultMessage: "Max elevation" }),
        body: intl.formatMessage({
          defaultMessage:
            "Highest point reached on the route — usually the summit or a high pass.",
        }),
      },
    });
  }

  const row3: StatTileProps[] = [];
  if (route.distanceMeters !== null) {
    row3.push({
      icon: RouteIcon,
      label: formatKm(route.distanceMeters) ?? "—",
      info: {
        title: intl.formatMessage({ defaultMessage: "Distance" }),
        body: intl.formatMessage({
          defaultMessage:
            "Total length of the route, following the GPS track end-to-end.",
        }),
      },
    });
  }
  if (route.movingTimeSeconds !== null) {
    row3.push({
      icon: Clock,
      label: formatDuration(route.movingTimeSeconds) ?? "—",
      info: {
        title: intl.formatMessage({ defaultMessage: "Moving time" }),
        body: intl.formatMessage({
          defaultMessage:
            "Time actually in motion — breaks and stops are excluded. A rough estimate of how long the trail takes at the author's pace.",
        }),
      },
    });
  }
  if (route.totalTimeSeconds !== null) {
    row3.push({
      icon: Hourglass,
      label: formatDuration(route.totalTimeSeconds) ?? "—",
      info: {
        title: intl.formatMessage({ defaultMessage: "Total time" }),
        body: intl.formatMessage({
          defaultMessage:
            "Full elapsed time, including breaks. Useful when planning a day out.",
        }),
      },
    });
  }
  const rows = [row1, row2, row3].filter((r) => r.length > 0);

  return (
    <ThemedView className="flex-1">
      <BlurredScreenHeader>{mountain?.name ?? title}</BlurredScreenHeader>
      <ScrollView
        contentContainerStyle={{
          paddingTop: headerHeight,
          paddingBottom: 96,
        }}
      >
        {/* Top block: title only, then a 2-col stats grid. Stat sizing
            mirrors the mountain detail header (text-xl font-medium with
            muted icons). */}
        <View className="gap-4 px-4 pt-2">
          <ThemedText className="text-2xl font-semibold leading-snug">
            {title}
          </ThemedText>
          {/* Three semantic rows (trail shape + difficulty / vertical profile /
              distances + times). Each row is its own flex-wrap so tiles
              within a row can wobble onto a second line on narrow screens
              without crossing the row boundary. */}
          <View className="gap-3">
            {rows.map((row, rowIndex) => (
              <View
                key={rowIndex}
                className="flex-row flex-wrap items-center gap-x-5 gap-y-2"
              >
                {row.map((stat, index) => (
                  <StatTile key={`${stat.label}-${index}`} {...stat} />
                ))}
              </View>
            ))}
          </View>
        </View>

        <View className="mt-8 gap-3 px-4">
          <ThemedText className="text-2xl font-semibold">
            <FormattedMessage defaultMessage="Actions" />
          </ThemedText>
          <ActionRow
            onPress={handleToggleSaved}
            icon={isSaved ? BookmarkCheck : Bookmark}
            intent={isSaved ? "emerald" : "muted"}
            size="sm"
          >
            {isSaved ? (
              <FormattedMessage defaultMessage="Saved" />
            ) : (
              <FormattedMessage defaultMessage="Save for later" />
            )}
          </ActionRow>
          <ActionRow
            onPress={() => void Linking.openURL(route.url)}
            icon={RouteIcon}
            iconOverride={<ExternalSourceIcon source={route.source} size={18} />}
            intent="muted"
            size="sm"
          >
            <FormattedMessage defaultMessage="Open on Wikiloc" />
          </ActionRow>
          {route.coordinates && route.coordinates.length > 0 ? (
            <ActionRow
              onPress={() => {
                const start = route.coordinates?.[0];
                if (!start) return;
                // Google Maps universal directions URL. Omitting `origin` lets
                // Google use the user's current location, prompting for it if
                // needed. `travelmode=driving` so it picks the road network
                // (the trailhead car park is what we're aiming at, not the
                // summit).
                const url =
                  `https://www.google.com/maps/dir/?api=1&travelmode=driving` +
                  `&destination=${start.lat},${start.lng}`;
                void Linking.openURL(url);
              }}
              icon={Car}
              intent="muted"
              size="sm"
            >
              <FormattedMessage defaultMessage="Drive to start" />
            </ActionRow>
          ) : null}
          <ActionRow
            onPress={() => void handleShare()}
            icon={ShareIcon}
            intent="muted"
            size="sm"
          >
            <FormattedMessage defaultMessage="Share with your friends" />
          </ActionRow>
        </View>

        {description ? (
          <View className="mt-8 gap-3 px-4">
            <ThemedText className="text-2xl font-semibold">
              <FormattedMessage defaultMessage="Description" />
            </ThemedText>
            {/* Prefer the Gemini-rewritten summary (lean, paragraphed, locale-
                appropriate). Falls back to raw Wikiloc prose for older
                scraper output. Collapsed to the first paragraph. */}
            {(() => {
              // Split on the first blank line ("\n\n"). If there isn't one,
              // fall back to the first newline so single-newline-separated
              // bodies still collapse. If neither matches we have a single
              // paragraph and the toggle hides itself.
              const blankIdx = description.indexOf("\n\n");
              const splitIdx =
                blankIdx >= 0 ? blankIdx : description.indexOf("\n");
              const firstParagraph =
                splitIdx >= 0 ? description.slice(0, splitIdx).trim() : description;
              const hasMore = splitIdx >= 0 && splitIdx < description.length - 1;
              return (
                <>
                  <ThemedText className="leading-relaxed text-muted-foreground">
                    {descriptionExpanded ? description : firstParagraph}
                  </ThemedText>
                  {hasMore && (
                    <TouchableOpacity
                      onPress={() => setDescriptionExpanded((v) => !v)}
                      activeOpacity={0.6}
                      className="self-start"
                    >
                      <ThemedText className="text-sm font-semibold text-primary">
                        {descriptionExpanded ? (
                          <FormattedMessage defaultMessage="View less" />
                        ) : (
                          <FormattedMessage defaultMessage="View more" />
                        )}
                      </ThemedText>
                    </TouchableOpacity>
                  )}
                </>
              );
            })()}
          </View>
        ) : null}

        <View className="mt-8 gap-3 px-4">
          <ThemedText className="text-2xl font-semibold">
            <FormattedMessage defaultMessage="Map" />
          </ThemedText>
          <View className="relative overflow-hidden rounded-xl" style={{ height: 320 }}>
            {route.coordinates && route.coordinates.length > 0 ? (
              <>
                <RouteMap route={route} />
                {/* Touch gate: absorbs scroll/pan attempts until the user
                    explicitly long-presses to engage with the map. While
                    locked, swipes go to the parent ScrollView; once unlocked
                    the overlay disables itself and Mapbox handles gestures
                    normally. Auto-relock on the next page navigation isn't
                    needed because the screen unmounts. `delayLongPress` is
                    400ms — long enough to disambiguate from a scroll start. */}
                {!mapUnlocked ? (
                  // Locked: full-bleed Pressable absorbs touches; long-press
                  // unlocks. The badge sits in the top-left corner (inside
                  // the Pressable's bounds, so a tap on it still counts as
                  // a tap on the gate — which does nothing — and only a
                  // long-press unlocks).
                  <Pressable
                    onLongPress={() => setMapUnlocked(true)}
                    delayLongPress={400}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                    }}
                  >
                    <View
                      style={{ position: "absolute", top: 8, left: 8 }}
                      className="flex-row items-center gap-1.5 rounded-full bg-background/85 px-3 py-1.5"
                    >
                      <LucideIcon icon={Lock} size={12} />
                      <ThemedText className="text-xs font-medium">
                        <FormattedMessage defaultMessage="Hold to interact with map" />
                      </ThemedText>
                    </View>
                  </Pressable>
                ) : (
                  <TouchableOpacity
                    onPress={() => setMapUnlocked(false)}
                    activeOpacity={0.8}
                    style={{ position: "absolute", top: 8, left: 8 }}
                    className="flex-row items-center gap-1.5 rounded-full bg-background/85 px-3 py-1.5"
                  >
                    <LucideIcon icon={LockOpen} size={12} />
                    <ThemedText className="text-xs font-medium">
                      <FormattedMessage defaultMessage="Lock map" />
                    </ThemedText>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <View className="flex-1 items-center justify-center bg-muted">
                <ThemedText className="text-sm text-muted-foreground">
                  <FormattedMessage defaultMessage="No GPS track available." />
                </ThemedText>
              </View>
            )}
          </View>
        </View>

        {route.mountains && route.mountains.length > 0 ? (
          <View className="mt-8 gap-3 px-4">
            <ThemedText className="text-2xl font-semibold">
              {route.mountains.length > 1 ? (
                <FormattedMessage defaultMessage="Summits" />
              ) : (
                <FormattedMessage defaultMessage="Summit" />
              )}
            </ThemedText>
            <SummitsList mountains={route.mountains} />
          </View>
        ) : null}

        <View className="mt-8 gap-3 px-4">
          <ThemedText className="text-2xl font-semibold">
            <FormattedMessage defaultMessage="Elevation profile" />
          </ThemedText>
          {route.coordinates && route.coordinates.length > 0 ? (
            <RouteElevationChart coordinates={route.coordinates} />
          ) : (
            <ThemedText className="text-sm text-muted-foreground">
              <FormattedMessage defaultMessage="No elevation data." />
            </ThemedText>
          )}
        </View>

      </ScrollView>
    </ThemedView>
  );
}

const iconForTrailType = (t: TrailType): LucideIconType => {
  if (t === "loop") return Repeat;
  return RouteIcon;
};

const formatTrailTypeLabel = (
  t: TrailType,
  intl: ReturnType<typeof useIntl>,
): string | null => {
  switch (t) {
    case "loop":
      return intl.formatMessage({ defaultMessage: "Circular" });
    case "out-and-back":
      return intl.formatMessage({ defaultMessage: "Out & back" });
    case "one-way":
      return intl.formatMessage({ defaultMessage: "One way" });
    default:
      return null;
  }
};

type StatTileProps = {
  icon: LucideIconType;
  label: string;
  info: { title: string; body: string };
  /** Optional rating-tier colour applied to BOTH the icon and the label. Used
   *  by the difficulty stat so it matches the mountain detail's crowd-rated
   *  difficulty chip colours (red → orange → green via tierColor). Other
   *  stats omit this and fall back to a muted icon + default text colour. */
  tint?: string;
};

const StatTile = ({ icon, label, info, tint }: StatTileProps) => (
  <TouchableOpacity
    onPress={() => Alert.alert(info.title, info.body)}
    activeOpacity={0.6}
    className="flex-row items-center gap-2"
  >
    <LucideIcon icon={icon} color={tint} muted={tint === undefined} />
    <ThemedText
      className="text-xl font-medium"
      style={tint ? { color: tint } : undefined}
      numberOfLines={1}
    >
      {label}
    </ThemedText>
  </TouchableOpacity>
);

// Renders one MountainRowMinimal per mountain the route summits. Each row
// taps through to that mountain's detail page, matching the visual of the
// mountain-detail screen's mountain rows. Mountain data comes embedded on
// the route response — no `useMountains` round-trip needed.
const SummitsList = ({ mountains }: { mountains: MountainData[] }) => (
  <View className="gap-2">
    {mountains.map((m) => (
      <MountainRowMinimal
        key={m.slug}
        slug={m.slug}
        name={m.name}
        height={m.height}
        imageUrl={m.imageUrl}
        essential={m.essential}
      />
    ))}
  </View>
);

// Structural skeleton that matches the loaded route detail layout: title +
// 3 stat rows + action rows + description block + map placeholder + summit
// row. The shapes mirror the real components so the layout doesn't shift
// when data lands.
const RouteDetailSkeleton = ({ headerHeight }: { headerHeight: number }) => (
  <ScrollView
    contentContainerStyle={{ paddingTop: headerHeight, paddingBottom: 96 }}
  >
    <View className="gap-4 px-4 pt-2">
      <Skeleton className="h-7 w-3/4 rounded" />
      <View className="gap-3">
        <View className="flex-row gap-5">
          <Skeleton className="h-7 w-24 rounded" />
          <Skeleton className="h-7 w-28 rounded" />
        </View>
        <View className="flex-row gap-5">
          <Skeleton className="h-7 w-20 rounded" />
          <Skeleton className="h-7 w-20 rounded" />
          <Skeleton className="h-7 w-24 rounded" />
        </View>
        <View className="flex-row gap-5">
          <Skeleton className="h-7 w-20 rounded" />
          <Skeleton className="h-7 w-20 rounded" />
        </View>
      </View>
    </View>

    <View className="mt-8 gap-3 px-4">
      <Skeleton className="h-7 w-24 rounded" />
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-12 w-full rounded-xl" />
    </View>

    <View className="mt-8 gap-3 px-4">
      <Skeleton className="h-7 w-32 rounded" />
      <Skeleton className="h-4 w-full rounded" />
      <Skeleton className="h-4 w-11/12 rounded" />
      <Skeleton className="h-4 w-9/12 rounded" />
    </View>

    <View className="mt-8 gap-3 px-4">
      <Skeleton className="h-7 w-16 rounded" />
      <Skeleton className="w-full rounded-xl" style={{ height: 320 }} />
    </View>

    <View className="mt-8 gap-3 px-4">
      <Skeleton className="h-7 w-24 rounded" />
      <View className="flex-row items-center gap-3">
        <Skeleton className="size-10 rounded" />
        <View className="flex-1 gap-1">
          <Skeleton className="h-4 w-3/5 rounded" />
          <Skeleton className="h-3 w-1/3 rounded" />
        </View>
      </View>
    </View>

    <View className="mt-8 gap-3 px-4">
      <Skeleton className="h-7 w-40 rounded" />
      <Skeleton className="h-32 w-full rounded-xl" />
    </View>
  </ScrollView>
);

