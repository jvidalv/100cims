import {
  ArrowLeftRight,
  ArrowRight,
  Clock,
  Repeat,
  Route as RouteIcon,
} from "lucide-react-native";
import { useIntl } from "react-intl";
import { TouchableOpacity, View } from "react-native";

import { RouteMap } from "@/components/route/route-map";
import { LucideIcon, ThemedText } from "@/components/ui/atoms";
import {
  formatDuration,
  formatKm,
  formatTrailType,
  isLoopRoute,
  pickLocalizedTitle,
} from "@/domains/route/route.format";

import type { MountainRoute, TrailType } from "@/domains/route/route.types";

// Pick an icon for each trailType variant. Loops get the literal "loop" icon
// (Repeat), out-and-back gets the bidirectional arrow, one-way gets the
// single arrow.
const iconForTrailType = (
  trailType: TrailType | null,
): Parameters<typeof LucideIcon>[0]["icon"] => {
  if (trailType === "loop") return Repeat;
  if (trailType === "out-and-back") return ArrowLeftRight;
  return ArrowRight;
};

type Props = {
  route: MountainRoute;
  onPress: () => void;
};

// Compact list row: 80×80 map thumbnail on the left, title (max 2 lines) and a
// chip strip of icon+value pairs (loop / distance / duration) below it. Same
// visual rhythm as MountainRowMinimal / PlanItemListCompact — image-left, text
// vertically centered. The map is pointer-events-disabled so taps fall through.
export const RouteListItem = ({ route, onPress }: Props) => {
  const intl = useIntl();
  const title = pickLocalizedTitle(route, intl);
  const distance = formatKm(route.distanceMeters);
  const duration = formatDuration(
    route.movingTimeSeconds ?? route.totalTimeSeconds,
  );
  // If Wikiloc gave us an explicit trailType use it; otherwise fall back to
  // "loop" when our coord-based heuristic (isLoopRoute) says start≈end. The
  // label and the icon below both consume effectiveType so they always agree.
  const effectiveType: TrailType | null =
    route.trailType ?? (isLoopRoute(route) ? "loop" : null);
  const trailTypeLabel = formatTrailType(effectiveType, intl);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="mb-3 flex-row items-center gap-3"
    >
      <View
        pointerEvents="none"
        className="size-20 overflow-hidden rounded border border-border bg-muted"
      >
        <RouteMap route={route} compact />
      </View>
      <View className="flex-1">
        <ThemedText
          numberOfLines={2}
          className="font-medium leading-snug"
        >
          {title}
        </ThemedText>
        <View className="mt-1 flex-row items-center gap-3">
          {trailTypeLabel ? (
            <Stat icon={iconForTrailType(effectiveType)} label={trailTypeLabel} />
          ) : null}
          {distance ? <Stat icon={RouteIcon} label={distance} /> : null}
          {duration ? <Stat icon={Clock} label={duration} /> : null}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const Stat = ({
  icon,
  label,
}: {
  icon: Parameters<typeof LucideIcon>[0]["icon"];
  label: string;
}) => (
  <View className="flex-row items-center gap-1">
    <LucideIcon icon={icon} size={13} muted />
    <ThemedText className="text-sm text-muted-foreground">{label}</ThemedText>
  </View>
);
