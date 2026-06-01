import {
  Camera,
  CircleLayer,
  LineLayer,
  MapView,
  ShapeSource,
} from "@rnmapbox/maps";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { isLoopRoute } from "@/domains/route/route.format";

import type { MountainRoute, TrailCoordinate } from "@/domains/route/route.types";

// Token + setAccessToken are set globally by mountains-map.tsx on app boot.
// We re-read the env var here only to know whether to render the placeholder.
const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;

// Satellite-streets shows terrain, forest cover, rock, snow — the context
// hikers actually need to read a route. Streets/labels are overlaid so the
// path names and refuges stay legible. We use the same style in both light
// and dark mode (satellite imagery doesn't have a dark variant; tinting via
// the SDK would just darken it uniformly).
const STYLE_URL = "mapbox://styles/mapbox/satellite-streets-v12";

const LINE_SOURCE_ID = "route-line-source";
const LINE_LAYER_ID = "route-line-layer";
const ENDPOINTS_SOURCE_ID = "route-endpoints-source";
const ENDPOINTS_LAYER_ID = "route-endpoints-layer";

type Props = {
  route: MountainRoute;
  /**
   * `compact` (default false) renders a thumbnail-style map: no attribution
   * chips, no logo, no gestures, no start/finish dots, thinner stroke. Used
   * inside list rows where the map is a 80px square preview, not the focal
   * map of the screen.
   */
  compact?: boolean;
};

const START_COLOR = "#10b981"; // emerald-500
const FINISH_COLOR = "#ef4444"; // red-500

const computeBounds = (coords: TrailCoordinate[]) => {
  let minLng = coords[0].lng;
  let maxLng = coords[0].lng;
  let minLat = coords[0].lat;
  let maxLat = coords[0].lat;
  for (const c of coords) {
    if (c.lng < minLng) minLng = c.lng;
    if (c.lng > maxLng) maxLng = c.lng;
    if (c.lat < minLat) minLat = c.lat;
    if (c.lat > maxLat) maxLat = c.lat;
  }
  return { minLng, maxLng, minLat, maxLat };
};

export const RouteMap = ({ route, compact = false }: Props) => {
  const coordinates = route.coordinates ?? [];

  // Empty-array guard so the useMemos below never read coordinates[0].
  if (!MAPBOX_TOKEN || coordinates.length === 0) {
    return <View style={styles.placeholder} />;
  }

  return (
    <RouteMapInner
      coordinates={coordinates}
      isLoop={isLoopRoute(route)}
      compact={compact}
    />
  );
};

const RouteMapInner = ({
  coordinates,
  isLoop,
  compact,
}: {
  coordinates: TrailCoordinate[];
  isLoop: boolean;
  compact: boolean;
}) => {
  const lineFeature = useMemo(
    () => ({
      type: "Feature" as const,
      geometry: {
        type: "LineString" as const,
        coordinates: coordinates.map((c) => [c.lng, c.lat]),
      },
      properties: {},
    }),
    [coordinates],
  );

  const endpointsFeature = useMemo(() => {
    const first = coordinates[0];
    const last = coordinates[coordinates.length - 1];
    type EndpointFeature = {
      type: "Feature";
      geometry: { type: "Point"; coordinates: [number, number] };
      properties: { kind: "start" | "finish"; color: string };
    };
    const features: EndpointFeature[] = [
      {
        type: "Feature",
        geometry: { type: "Point", coordinates: [first.lng, first.lat] },
        properties: { kind: "start", color: START_COLOR },
      },
    ];
    // On a loop the start and end overlap visually, so drawing a red finish
    // dot on top of the green start dot just hides the start. Skip it.
    if (!isLoop) {
      features.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: [last.lng, last.lat] },
        properties: { kind: "finish", color: FINISH_COLOR },
      });
    }
    return { type: "FeatureCollection" as const, features };
  }, [coordinates, isLoop]);

  // Skip the endpoint dots entirely in compact mode — at 80px wide the start
  // dot eats too much of the visible track.
  const showEndpoints = !compact;

  // Camera bounds computed up front so we can pass them via `defaultSettings`.
  // `useEffect + cameraRef.setCamera` post-mount is unreliable on cold open:
  // the Camera child often isn't attached yet and the setCamera call no-ops,
  // leaving the map at its default world view. `defaultSettings` is read by
  // Mapbox during the camera's own init, so it always lands correctly.
  const cameraDefaults = useMemo(() => {
    const { minLng, maxLng, minLat, maxLat } = computeBounds(coordinates);
    const lngSpan = maxLng - minLng;
    const latSpan = maxLat - minLat;
    // Compact thumbnails still use bounds-based fit — they're tiny squares
    // and the bounds rectangle matches the box's aspect ratio closely enough.
    if (compact) {
      const padLng = Math.max(0.0005, lngSpan * 0.04);
      const padLat = Math.max(0.0005, latSpan * 0.04);
      return {
        bounds: {
          ne: [maxLng + padLng, maxLat + padLat] as [number, number],
          sw: [minLng - padLng, minLat - padLat] as [number, number],
        },
        padding: {
          paddingTop: 4,
          paddingBottom: 4,
          paddingLeft: 4,
          paddingRight: 4,
        },
      };
    }
    // Detail map: focus on the starting point at a fixed zoom level rather
    // than fitting the whole trail. The auto-fit math was unreliable for
    // long/vertical trails on small viewports; users can pan up the route
    // from a clear starting point instead. Lock bounds (below) still cap
    // pan and pinch-out so the surrounding area is reachable but they can't
    // wander off to the next valley.
    const START_FOCUS_ZOOM = 13;
    const start = coordinates[0];
    return {
      centerCoordinate: [start.lng, start.lat] as [number, number],
      zoomLevel: START_FOCUS_ZOOM,
    };
  }, [coordinates, compact]);

  // Lock bounds only apply to the full detail map. Computed against the trail
  // bbox PLUS a 30% margin on each side so the user can pan a bit beyond the
  // route to see the surrounding terrain — without losing the route entirely.
  // `minZoomLevel` is derived from the same padded span (with a small slack
  // so the initial fit isn't pinned exactly at the floor). The list thumbnail
  // disables scroll/zoom outright so it doesn't need either prop.
  const lockSettings = useMemo(() => {
    if (compact) return null;
    const { minLng, maxLng, minLat, maxLat } = computeBounds(coordinates);
    const lngSpan = maxLng - minLng;
    const latSpan = maxLat - minLat;
    // 30% margin around the trail. Floor of ~50m so a degenerate single-point
    // trail still gets a usable bbox.
    const lockPadLng = Math.max(0.0005, lngSpan * 0.3);
    const lockPadLat = Math.max(0.0005, latSpan * 0.3);
    const paddedSpanDeg = Math.max(lngSpan + lockPadLng * 2, latSpan + lockPadLat * 2);
    const minZoom = Math.max(
      4,
      Math.min(14, Math.log2(360 / paddedSpanDeg) - 0.3),
    );
    return {
      maxBounds: {
        ne: [maxLng + lockPadLng, maxLat + lockPadLat] as [number, number],
        sw: [minLng - lockPadLng, minLat - lockPadLat] as [number, number],
      },
      minZoomLevel: minZoom,
    };
  }, [coordinates, compact]);

  return (
    <MapView
      style={styles.map}
      styleURL={STYLE_URL}
      compassEnabled={false}
      scaleBarEnabled={false}
      attributionEnabled={!compact}
      logoEnabled={!compact}
      logoPosition={{ bottom: 8, left: 8 }}
      attributionPosition={{ bottom: 8, right: 8 }}
      // Flat top-down view, no 3D, matching /mountains. In compact mode also
      // disable scroll/zoom so the map behaves as a non-touchable thumbnail
      // and taps fall through to the wrapping row.
      pitchEnabled={false}
      rotateEnabled={false}
      scrollEnabled={!compact}
      zoomEnabled={!compact}
    >
      <Camera
        defaultSettings={cameraDefaults}
        animationMode="none"
        // Clamp pan + pinch-out only on the full detail map.
        maxBounds={lockSettings?.maxBounds}
        minZoomLevel={lockSettings?.minZoomLevel}
      />
      <ShapeSource id={LINE_SOURCE_ID} shape={lineFeature}>
        <LineLayer
          id={LINE_LAYER_ID}
          style={{
            lineColor: "#0ea5e9", // sky-500
            lineWidth: compact ? 2.5 : 4,
            lineOpacity: 0.9,
            lineCap: "round",
            lineJoin: "round",
          }}
        />
      </ShapeSource>
      {showEndpoints ? (
        <ShapeSource id={ENDPOINTS_SOURCE_ID} shape={endpointsFeature}>
          <CircleLayer
            id={ENDPOINTS_LAYER_ID}
            style={{
              circleColor: ["get", "color"],
              circleRadius: 8,
              circleStrokeColor: "#ffffff",
              circleStrokeWidth: 3,
            }}
          />
        </ShapeSource>
      ) : null}
    </MapView>
  );
};

const styles = StyleSheet.create({
  map: { flex: 1 },
  placeholder: { flex: 1, backgroundColor: "#e5e5e5" },
});
