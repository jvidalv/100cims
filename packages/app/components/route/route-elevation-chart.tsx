import { useColorScheme } from "nativewind";
import { useMemo } from "react";
import { FormattedMessage } from "react-intl";
import { View } from "react-native";
import { Circle, Line, Path, Svg } from "react-native-svg";

import { ThemedText } from "@/components/ui/atoms";
import { distanceMeters as distanceBetween } from "@/domains/route/route.format";

import type { TrailCoordinate } from "@/domains/route/route.types";

type Props = {
  coordinates: TrailCoordinate[];
  /** Pixel height of the chart area. Width fills the parent. */
  height?: number;
};

const STROKE_LIGHT = "#0ea5e9"; // sky-500
const STROKE_DARK = "#38bdf8"; // sky-400
const FILL_LIGHT = "rgba(14, 165, 233, 0.15)";
const FILL_DARK = "rgba(56, 189, 248, 0.2)";

// Wikiloc trails ship 1k-4k points; SVG paths get sluggish past ~500 commands.
// Pick every Nth so we always emit a manageable number while keeping shape.
const MAX_PATH_POINTS = 400;

type ChartPoint = { distanceM: number; ele: number };

const buildSeries = (coords: TrailCoordinate[]): ChartPoint[] => {
  if (coords.length === 0) return [];
  const out: ChartPoint[] = [];
  let cumulative = 0;
  for (let i = 0; i < coords.length; i++) {
    const c = coords[i];
    if (c.ele === null) continue;
    if (i > 0) cumulative += distanceBetween(coords[i - 1], c);
    out.push({ distanceM: cumulative, ele: c.ele });
  }
  if (out.length <= MAX_PATH_POINTS) return out;
  const step = out.length / MAX_PATH_POINTS;
  const decimated: ChartPoint[] = [];
  for (let i = 0; i < MAX_PATH_POINTS; i++) {
    decimated.push(out[Math.floor(i * step)]);
  }
  // Always pin the last point so the path ends at the true distance.
  decimated[decimated.length - 1] = out[out.length - 1];
  return decimated;
};

export const RouteElevationChart = ({ coordinates, height = 160 }: Props) => {
  const { colorScheme } = useColorScheme();
  const series = useMemo(() => buildSeries(coordinates), [coordinates]);

  const layout = useMemo(() => {
    if (series.length < 2) return null;
    const xs = series.map((p) => p.distanceM);
    const ys = series.map((p) => p.ele);
    const minX = xs[0];
    const maxX = xs[xs.length - 1];
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    return { minX, maxX, minY, maxY };
  }, [series]);

  if (!layout) {
    return (
      <View style={{ height }} className="items-center justify-center">
        <ThemedText className="text-sm text-muted-foreground">—</ThemedText>
      </View>
    );
  }

  const { minX, maxX, minY, maxY } = layout;
  const xSpan = Math.max(1, maxX - minX);
  const ySpan = Math.max(1, maxY - minY);
  // Find the series point at the trail's highest elevation so we can overlay
  // a small "max" marker on the chart — useful at a glance when looking at
  // the trail's profile.
  const peakPoint = series.reduce(
    (best, p) => (p.ele > best.ele ? p : best),
    series[0],
  );
  // viewBox in normalised units; the SVG element stretches it to the parent
  // width so we don't need to measure layout.
  const VIEWBOX_W = 1000;
  const VIEWBOX_H = 300;
  // Reserve 12px at top/bottom inside the viewBox so the stroke isn't clipped
  // and there's headroom for the highest point's label area.
  const PAD_TOP = 12;
  const PAD_BOTTOM = 12;
  const innerH = VIEWBOX_H - PAD_TOP - PAD_BOTTOM;

  const toX = (d: number): number => ((d - minX) / xSpan) * VIEWBOX_W;
  const toY = (e: number): number =>
    PAD_TOP + innerH - ((e - minY) / ySpan) * innerH;

  const linePath = series
    .map((p, i) => {
      const cmd = i === 0 ? "M" : "L";
      return `${cmd}${toX(p.distanceM).toFixed(2)},${toY(p.ele).toFixed(2)}`;
    })
    .join(" ");

  const areaPath =
    `${linePath} ` +
    `L${VIEWBOX_W.toFixed(2)},${(PAD_TOP + innerH).toFixed(2)} ` +
    `L0,${(PAD_TOP + innerH).toFixed(2)} Z`;

  const isDark = colorScheme === "dark";
  const stroke = isDark ? STROKE_DARK : STROKE_LIGHT;
  const fill = isDark ? FILL_DARK : FILL_LIGHT;

  return (
    <View>
      <View
        style={{ height }}
        className="relative overflow-hidden rounded-lg bg-muted/30"
      >
        <Svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
          preserveAspectRatio="none"
        >
          <Path d={areaPath} fill={fill} />
          <Path d={linePath} stroke={stroke} strokeWidth={4} fill="none" />
          {/* Vertical guide + dot at the trail's highest point. preserveAspectRatio
              is "none" so the viewBox is stretched non-uniformly into the rendered
              box; that means the dot becomes an oval and the line stays vertical
              regardless, which is fine for a marker. */}
          <Line
            x1={toX(peakPoint.distanceM)}
            x2={toX(peakPoint.distanceM)}
            y1={toY(peakPoint.ele)}
            y2={PAD_TOP + innerH}
            stroke={stroke}
            strokeWidth={2}
            strokeDasharray="6,6"
            opacity={0.55}
          />
          <Circle
            cx={toX(peakPoint.distanceM)}
            cy={toY(peakPoint.ele)}
            r={10}
            fill={stroke}
            stroke="#ffffff"
            strokeWidth={3}
          />
        </Svg>
        {/* Peak elevation pill, absolutely positioned. We compute its left as
            the peak's x ratio so it tracks the dot horizontally; the SVG
            coordinate space is normalised to VIEWBOX_W. */}
        <View
          style={{
            position: "absolute",
            top: 6,
            left: `${(toX(peakPoint.distanceM) / VIEWBOX_W) * 100}%`,
            transform: [{ translateX: -28 }],
          }}
          className="rounded-full bg-background/90 px-2 py-0.5"
        >
          <ThemedText className="text-xs font-semibold">
            {`${Math.round(peakPoint.ele)} m`}
          </ThemedText>
        </View>
      </View>
      {/* Bottom-corner labels: min elevation (left) and max elevation (right).
          We *intentionally* don't anchor these to the trail's first/last GPS
          points — on loop trails the start and end share an elevation, and a
          big number at the right edge looks like "trail ends here" rather
          than "highest point on the route". Distance is shown in the top
          stat row so we don't duplicate it here. */}
      <View className="mt-2 flex-row justify-between">
        <ThemedText className="text-xs text-muted-foreground">
          <FormattedMessage
            defaultMessage="Min {value}"
            values={{ value: `${Math.round(minY)} m` }}
          />
        </ThemedText>
        <ThemedText className="text-xs text-muted-foreground">
          <FormattedMessage
            defaultMessage="Max {value}"
            values={{ value: `${Math.round(maxY)} m` }}
          />
        </ThemedText>
      </View>
    </View>
  );
};
