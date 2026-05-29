import { Circle, Path, Svg } from "react-native-svg";

import type { RouteSource } from "@/domains/route/route.types";

type Props = {
  source: RouteSource;
  size?: number;
};

// Stylized round badge used as the visual marker for the route's external
// source. Inspired by the outdoors-trail-community badge motif: a coloured
// disc with two intertwined organic shapes through the middle. Generic
// design so it can be reused across providers (Strava / Komoot / etc.) by
// extending PALETTE.
const PALETTE: Record<
  RouteSource,
  { disc: string; accent: string }
> = {
  wikiloc: { disc: "#3f9c4d", accent: "#f5a623" },
};

export const ExternalSourceIcon = ({ source, size = 20 }: Props) => {
  const { disc, accent } = PALETTE[source];
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      {/* Round green disc base. */}
      <Circle cx={32} cy={32} r={30} fill={disc} />
      {/* Orange S-curve threading from top-left to bottom-right through the
          middle of the disc — an elongated tear-drop drawn with two bezier
          curves that taper at both ends. */}
      <Path
        d="M22 10
           C 36 14, 42 24, 38 32
           C 34 40, 28 50, 42 54
           C 28 54, 20 44, 24 32
           C 28 22, 36 16, 22 10 Z"
        fill={accent}
      />
    </Svg>
  );
};
