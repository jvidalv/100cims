import * as Linking from "expo-linking";
import { useGlobalSearchParams } from "expo-router";
import {
  Car,
  Clock,
  Hourglass,
  Mountain,
  Repeat,
  Route as RouteIcon,
  Share as ShareIcon,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
} from "lucide-react-native";
import type { LucideIcon as LucideIconType } from "lucide-react-native";
import { useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  Alert,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";

import { ExternalSourceIcon } from "@/components/route/external-source-icon";
import { RouteElevationChart } from "@/components/route/route-elevation-chart";
import { RouteMap } from "@/components/route/route-map";
import {
  Avatar,
  LucideIcon,
  ThemedText,
  ThemedView,
  tierColor,
} from "@/components/ui/atoms";
import {
  ActionRow,
  BlurredScreenHeader,
  useBlurredScreenHeaderHeight,
} from "@/components/ui/molecules";
import { useRouteByTrailId } from "@/domains/route/route.api";
import {
  difficultyPosition,
  formatDifficulty,
  formatDuration,
  formatKm,
  formatMeters,
  isLoopRoute,
  pickLocalizedTitle,
} from "@/domains/route/route.format";
import { shareDeeplink } from "@/lib/share";

import type { MountainRoute, TrailType } from "@/domains/route/route.types";

const authorSearchUrl = (route: MountainRoute): string => {
  if (route.source === "wikiloc" && route.author) {
    return `https://www.wikiloc.com/wikiloc/find.do?q=${encodeURIComponent(route.author)}`;
  }
  return route.url;
};

const initialsFor = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function RouteDetailScreen() {
  const intl = useIntl();
  const { slug, routeId } = useGlobalSearchParams<{
    slug: string;
    routeId: string;
  }>();
  const route = useRouteByTrailId(slug, routeId);
  const headerHeight = useBlurredScreenHeaderHeight();
  // Map starts locked: an overlay above the MapView absorbs touches so a
  // tap or short drag scrolls the parent ScrollView normally. Long-press
  // unlocks it. This sidesteps the common "I tried to scroll the page but
  // the map captured my pan" problem on embedded maps.
  const [mapUnlocked, setMapUnlocked] = useState(false);
  // Description collapses to 3 lines by default. Wikiloc descriptions are
  // commonly 1–2KB of author prose and would otherwise push the rest of the
  // screen far below the fold.
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  if (!route) {
    return (
      <ThemedView className="flex-1">
        <BlurredScreenHeader>
          <FormattedMessage defaultMessage="Route" />
        </BlurredScreenHeader>
        <View
          className="flex-1 items-center justify-center px-6"
          style={{ paddingTop: headerHeight }}
        >
          <ThemedText className="text-center text-muted-foreground">
            <FormattedMessage defaultMessage="Route not found." />
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  const title = pickLocalizedTitle(route, intl);
  // If Wikiloc gave us a trailType use it, otherwise infer loop from geometry.
  const effectiveType: TrailType | null =
    route.trailType ?? (isLoopRoute(route) ? "loop" : null);
  const isLoop = effectiveType === "loop";

  const handleShare = async (): Promise<void> => {
    if (!slug) return;
    await shareDeeplink({
      intl,
      path: `mountain/${slug}/routes/${route.externalId}`,
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
      <BlurredScreenHeader>
        <ThemedText
          numberOfLines={1}
          className="max-w-56 text-lg font-medium"
        >
          {title}
        </ThemedText>
      </BlurredScreenHeader>
      <ScrollView
        contentContainerStyle={{
          paddingTop: headerHeight,
          paddingBottom: 96,
        }}
      >
        {/* Top block: title only, then a 2-col stats grid. Author chip moved
            to the "Made by" section near the bottom. Stat sizing mirrors the
            mountain detail header (text-xl font-medium with muted icons). */}
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

        {route.descriptionRaw ? (
          <View className="mt-8 gap-3 px-4">
            <ThemedText className="text-2xl font-semibold">
              <FormattedMessage defaultMessage="Description" />
            </ThemedText>
            {/* Author's prose scraped from Wikiloc. Collapsed to 3 lines by
                default — Wikiloc descriptions are often a wall of text and we
                don't want them dominating the screen. `numberOfLines` is the
                cheap clip; toggle reveals the full content. */}
            <ThemedText
              numberOfLines={descriptionExpanded ? undefined : 3}
              className="leading-relaxed text-muted-foreground"
            >
              {route.descriptionRaw}
            </ThemedText>
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
                    <View className="absolute bottom-3 self-center rounded-full bg-background/85 px-3 py-1.5">
                      <ThemedText className="text-xs font-medium">
                        <FormattedMessage defaultMessage="Hold to interact with map" />
                      </ThemedText>
                    </View>
                  </Pressable>
                ) : (
                  <TouchableOpacity
                    onPress={() => setMapUnlocked(false)}
                    activeOpacity={0.8}
                    style={{ position: "absolute", top: 8, right: 8 }}
                    className="rounded-full bg-background/85 px-3 py-1.5"
                  >
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

        {route.author ? (
          <View className="mt-8 gap-3 px-4">
            <ThemedText className="text-2xl font-semibold">
              <FormattedMessage defaultMessage="Made by" />
            </ThemedText>
            <ActionRow
              onPress={() => void Linking.openURL(authorSearchUrl(route))}
              icon={RouteIcon}
              iconOverride={
                <Avatar size="xs" initials={initialsFor(route.author)} />
              }
              intent="muted"
              size="sm"
            >
              {route.author}
            </ActionRow>
          </View>
        ) : null}
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

