import Mapbox, {
  Camera,
  CircleLayer,
  Images,
  MapView,
  ShapeSource,
  SymbolLayer,
} from "@rnmapbox/maps";
import { useColorScheme } from "nativewind";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormattedMessage } from "react-intl";
import {
  ActivityIndicator,
  Keyboard,
  StyleSheet,
  View,
} from "react-native";


import { ThemedText } from "@/components/ui/atoms";
import { Colors } from "@/constants/colors";
// @rnmapbox/maps doesn't re-export its ref types from the package root —
// `Camera` (the class) has a same-named type alias to its ref interface
// (see node_modules/@rnmapbox/maps/.../Camera.d.ts), and `ShapeSource`'s
// imperative methods live on the class instance.
type CameraRef = Camera;
type ShapeSourceRef = ShapeSource;

// Mapbox SDK reads the access token from a module-level singleton. Setting
// it here once means every MapView in the app picks it up automatically.
// `EXPO_PUBLIC_*` vars are inlined into the bundle at build time.
const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
if (!MAPBOX_TOKEN && __DEV__) {
  console.warn(
    "[MountainsMap] EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN is not set — map tiles will fail to load. Add it to packages/app/.env.local and rebuild.",
  );
}
// Only call setAccessToken when we have a real token. Passing "" to Mapbox
// silently no-ops (every tile then 401s with no error surface); skipping the
// call lets the SDK throw a clearer "no token" error on first map mount.
if (MAPBOX_TOKEN) Mapbox.setAccessToken(MAPBOX_TOKEN);

// Satellite-streets for both light and dark: aerial imagery shows terrain,
// forest cover, rock and snow at all zoom levels, which is the context hikers
// actually use to read the map. Streets/labels are overlaid so mountain names
// and clusters stay legible. Satellite imagery has no dark variant so we use
// the same style in both modes.
const STYLE_LIGHT = "mapbox://styles/mapbox/satellite-streets-v12";
const STYLE_DARK = "mapbox://styles/mapbox/satellite-streets-v12";

const COLOR_SUMMITED = "#10b981";
const COLOR_ESSENTIAL = Colors.light.primary;
const COLOR_DEFAULT = "#6b7280";
const COLOR_CLUSTER = "#000000";

const SOURCE_ID = "mountains";
const CLUSTER_LAYER_ID = "mountains-cluster";
const CLUSTER_COUNT_LAYER_ID = "mountains-cluster-count";
const UNCLUSTERED_LAYER_ID = "mountains-unclustered";
// Labels live in their own ShapeSource so they don't bubble taps up to
// the main mountains source. Same shape data — cheap.
const LABEL_SOURCE_ID = "mountains-labels";
const LABEL_LAYER_ID = "mountains-label";

const USER_SOURCE_ID = "user-location";
const USER_HALO_LAYER_ID = "user-location-halo";
const USER_DOT_LAYER_ID = "user-location-dot";

// Brief tap-feedback ring rendered at the coordinate of the last-tapped
// mountain dot. Mapbox interpolates `circleRadius` / `circleOpacity`
// between renders via the layer's *Transition properties, so flipping the
// state value triggers a smooth grow + fade-out without us touching
// `Animated` (which would also need a paint-on-every-frame `setState`).
const TAP_PULSE_SOURCE_ID = "mountain-tap-pulse";
const TAP_PULSE_LAYER_ID = "mountain-tap-pulse-layer";
const TAP_PULSE_DURATION_MS = 400;
const TAP_PULSE_START_RADIUS = 7;
const TAP_PULSE_END_RADIUS = 22;
// Standard iOS Maps blue dot — Apple uses #007AFF for the centre disc and a
// translucent variant for the surrounding halo.
const COLOR_USER_DOT = "#007AFF";
const COLOR_USER_HALO = "rgba(0, 122, 255, 0.2)";

// Half-edge in degrees that we expand zero-area bboxes by so a single-mountain
// filter doesn't collapse the camera to an undefined zoom. ~5km on either side
// at our latitudes — enough that Mapbox picks a reasonable zoom for one peak.
const SINGLE_POINT_PADDING = 0.05;

// Fallback camera frame when the mountain set is empty (e.g. a user with
// no active challenge, or a challenge that hasn't had mountains assigned
// yet). Centred on Catalonia at a wide regional zoom so the user sees
// something recognisable instead of Mapbox's default world view (Persian
// Gulf-ish), then can pan to wherever they want.
const FALLBACK_CENTER: [number, number] = [1.8, 41.8];
const FALLBACK_ZOOM = 7;

// NE/SW corners of the bbox enclosing a mountain set, with zero-axis
// collapses padded so Mapbox always has a non-degenerate box to work with.
// Returns null for empty input — callers handle the no-mountains case
// separately (initial mount is gated upstream; filter narrowing keeps the
// previous camera position when the new set is empty).
const computeBounds = (
  mountains: Pick<Mountain, "latitude" | "longitude">[],
): { ne: [number, number]; sw: [number, number] } | null => {
  if (mountains.length === 0) return null;
  const lats = mountains.map((m) => parseFloat(m.latitude));
  const lngs = mountains.map((m) => parseFloat(m.longitude));
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  return {
    ne: [
      maxLng + (maxLng - minLng < 1e-6 ? SINGLE_POINT_PADDING : 0),
      maxLat + (maxLat - minLat < 1e-6 ? SINGLE_POINT_PADDING : 0),
    ],
    sw: [
      minLng - (maxLng - minLng < 1e-6 ? SINGLE_POINT_PADDING : 0),
      minLat - (maxLat - minLat < 1e-6 ? SINGLE_POINT_PADDING : 0),
    ],
  };
};

// On-marker label settings — kept here so the magic numbers are in one place.
// `LABEL_MIN_ZOOM` is the zoom at which the per-marker name/height tag becomes
// visible; below this the map is too dense for labels to read.
const LABEL_NAME_MAX = 18;
// Zoom at which the per-marker label appears. Bumped a couple of stops
// above cluster-dissolve (zoom 9) so labels only show once the user is
// close enough that the names won't overlap into a dense wall of text on
// the satellite basemap.
const LABEL_MIN_ZOOM = 11;
// Per-theme label colors. Dark slate on the light Standard basemap and
// near-white on the dark-v11 basemap — picking one color for both turns
// invisible on the opposite scheme.
const COLOR_LABEL_LIGHT = "#1f2937";
const COLOR_LABEL_DARK = "#f3f4f6";

interface Mountain {
  id: string;
  latitude: string;
  longitude: string;
  name: string;
  height: string;
  location: string;
  essential: boolean;
  slug: string;
  imageUrl: string | null;
}

interface MountainsMapProps {
  mountains: Mountain[];
  summitedSlugs: string[];
  userLocation?: { coords: { latitude: number; longitude: number } } | null;
  isLoading?: boolean;
  /** Fired when the user taps a marker. Parent owns the preview state so the
   *  card can be rendered above other floating overlays (the chip cluster
   *  lives in the parent at z-10; the card needs to paint over it). */
  onPreviewChange?: (preview: MountainPreview | null) => void;
  /** When set, the map mounts the camera-control imperative API on this ref
   *  so the parent screen can trigger recenter from a button rendered outside
   *  the map (e.g. the bottom-right action cluster). Kept optional to keep
   *  any other call sites working without changes. */
  controlRef?: { current: MountainsMapControl | null };
}

export interface MountainPreview {
  slug: string;
  fallback: {
    name: string;
    height: string;
    location: string;
    imageUrl: string | null;
    essential: boolean;
    isSummited: boolean;
  };
}

export interface MountainsMapControl {
  /** Fly to the current user-location with a sensible regional zoom. No-op
   *  if location hasn't resolved yet. */
  recenterOnUser: () => void;
}

export function MountainsMap({
  mountains,
  summitedSlugs,
  userLocation,
  isLoading = false,
  onPreviewChange,
  controlRef,
}: MountainsMapProps) {
  // `useColorScheme` from nativewind (not react-native) so the map follows
  // any manual theme override the user makes via NativeWind, matching the
  // preview card and other themed components.
  const { colorScheme } = useColorScheme();
  const cameraRef = useRef<CameraRef>(null);
  const shapeSourceRef = useRef<ShapeSourceRef>(null);
  // Initial camera bounds, computed once at first render from the
  // `mountains` prop. The parent gates mounting on data being available
  // (skeleton until then), so we always have a populated array here and
  // can hand the bbox straight to `<Camera defaultSettings>`. Mapbox reads
  // that during native init, so the map opens directly on the challenge
  // region — no pan-from-default-world animation. Subsequent filter
  // narrowings go through the imperative useEffect below.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initialBounds = useMemo(() => computeBounds(mountains), []);
  const setPreview = useCallback(
    (preview: MountainPreview | null) => {
      onPreviewChange?.(preview);
    },
    [onPreviewChange],
  );
  // Track mount state so async native callbacks can bail before dispatching
  // to a torn-down view tag (the source of `Unknown reactTag: NNN` errors).
  const isMountedRef = useRef(true);
  // Mount the imperative camera API on the parent's ref so a button rendered
  // outside the map can drive the camera. We re-mount on every userLocation
  // change so the closure always captures the latest fix — cheap because the
  // parent only reads `.current` at button-tap time.
  useEffect(() => {
    if (!controlRef) return;
    controlRef.current = {
      recenterOnUser: () => {
        if (!userLocation) return;
        // Only pan to the user's coords; preserve whatever zoom they're at.
        // Forcing zoom 9 would yank a user zoomed in to inspect a peak back
        // out to a regional view — the opposite of what "where am I" means.
        cameraRef.current?.setCamera({
          centerCoordinate: [
            userLocation.coords.longitude,
            userLocation.coords.latitude,
          ],
          animationDuration: 600,
        });
      },
    };
    return () => {
      if (controlRef) controlRef.current = null;
    };
  }, [controlRef, userLocation]);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Tap-feedback ring. `pulseCoord` holds the [lng, lat] of the most-recent
  // marker tap; we toggle `pulseActive` between two states (start small +
  // opaque, then end larger + transparent) on render frames the user sees,
  // and Mapbox interpolates between them over TAP_PULSE_DURATION_MS via the
  // layer's transitions. After the animation has completed we clear the
  // source so the (invisible) circle isn't kept around in the GPU pipeline.
  const [pulseCoord, setPulseCoord] = useState<[number, number] | null>(null);
  const [pulseColor, setPulseColor] = useState<string>(COLOR_DEFAULT);
  const [pulseActive, setPulseActive] = useState(false);
  useEffect(() => {
    if (!pulseCoord) return;
    // Frame 1: source mounted with start values (small + visible). Then
    // flip to the end values after a short delay so the native side has
    // committed the initial layer style and the *Transition props have
    // something to interpolate from. `requestAnimationFrame` alone wasn't
    // enough — Mapbox's RN bridge appears to batch consecutive style
    // updates within a microtask, so the start state never reaches native.
    const flip = setTimeout(() => setPulseActive(true), 16);
    const clear = setTimeout(
      () => {
        setPulseCoord(null);
        setPulseActive(false);
      },
      TAP_PULSE_DURATION_MS + 16,
    );
    return () => {
      clearTimeout(flip);
      clearTimeout(clear);
    };
  }, [pulseCoord]);

  // Build a GeoJSON FeatureCollection of all mountains. Mapbox does the
  // clustering natively from this source so we don't pay React render cost
  // per marker — there are just two layers regardless of mountain count.
  const featureCollection = useMemo<GeoJSON.FeatureCollection<GeoJSON.Point>>(
    () => ({
      type: "FeatureCollection",
      features: mountains.map((m) => {
        const isSummited = summitedSlugs.includes(m.slug);
        // Pre-truncated label for the on-marker SymbolLayer — string ops in
        // Mapbox expressions are clumsy, so do it here. Format: name
        // (≤18 chars with ellipsis) followed by elevation in parens.
        const truncatedName =
          m.name.length > LABEL_NAME_MAX
            ? `${m.name.slice(0, LABEL_NAME_MAX - 1)}…`
            : m.name;
        const label = `${truncatedName} (${m.height}m)`;
        // Single-priority colour for the whole dot (fill + border share
        // it). Summited wins outright — if you've climbed it, the dot is
        // fully emerald regardless of essential-ness. Otherwise essential
        // = red, default = gray.
        const dotColor = isSummited
          ? COLOR_SUMMITED
          : m.essential
            ? COLOR_ESSENTIAL
            : COLOR_DEFAULT;
        return {
          type: "Feature",
          // Mapbox needs a stable id (number or string) for cluster math.
          id: m.id,
          geometry: {
            type: "Point",
            coordinates: [parseFloat(m.longitude), parseFloat(m.latitude)],
          },
          properties: {
            id: m.id,
            // Carry lat/lng through to taps — the GeoJSON `properties` bag
            // is the only thing handlePress receives, geometry isn't surfaced.
            latitude: m.latitude,
            longitude: m.longitude,
            name: m.name,
            height: m.height,
            location: m.location,
            essential: m.essential,
            slug: m.slug,
            imageUrl: m.imageUrl,
            isSummited,
            // Numeric counterpart for cluster aggregation — Mapbox's
            // `clusterProperties` accumulator only adds numbers, so we
            // pre-cast the boolean. Summed across the cluster to compute
            // `summitedCount`, which we compare to `point_count` to decide
            // whether the cluster is fully completed.
            isSummitedNum: isSummited ? 1 : 0,
            label,
            fillColor: dotColor,
            strokeColor: dotColor,
          },
        };
      }),
    }),
    [mountains, summitedSlugs],
  );

  // Compact signature of the current mountain set so we only re-fit when the
  // set actually changes (filter toggles, search, summit-status updates).
  // Re-fitting on every render would yank the camera while the user pans.
  const mountainsKey = useMemo(
    () =>
      mountains.length === 0
        ? ""
        : mountains
            .map((m) => `${m.id}:${m.latitude},${m.longitude}`)
            .sort()
            .join("|"),
    [mountains],
  );

  // Imperative re-fit on filter changes (search, Essentials toggle, altitude
  // band, etc.). Initial mount is handled by `<Camera defaultSettings>`, so
  // this is only ever a "narrow to the new subset" animation. Skips on
  // first run because defaultSettings already set the same bounds.
  const firstRunRef = useRef(true);
  useEffect(() => {
    if (firstRunRef.current) {
      firstRunRef.current = false;
      return;
    }
    const camera = cameraRef.current;
    if (!camera) return;
    const bounds = computeBounds(mountains);
    if (!bounds) return;
    camera.fitBounds(bounds.ne, bounds.sw, [80, 40, 80, 40], 500);
    // mountains reference changes are captured by mountainsKey; depending
    // on the array directly would re-fit on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mountainsKey]);

  const handlePress = async (event: { features: GeoJSON.Feature[] }) => {
    // Any tap on a marker (or cluster) should drop the keyboard if the user
    // was typing in the search input — otherwise the keyboard hides the
    // preview card that's about to slide up.
    Keyboard.dismiss();
    // Mapbox returns ALL features under the tap, in arbitrary order. At
    // clustered zooms a tap on the cluster disk can sometimes return an
    // unclustered feature first (e.g. when a label-source feature lives at
    // the same coordinate), making `features[0].cluster` undefined and
    // triggering the preview branch. Prefer the cluster feature whenever
    // one is present in the hit-list — `point_count` is set ONLY on
    // cluster features, never on raw points, so it's the safest signal.
    const feature =
      event.features.find(
        (f) =>
          f.properties &&
          typeof f.properties === "object" &&
          "point_count" in f.properties,
      ) ?? event.features[0];
    const props = feature?.properties;
    if (!feature || !props || typeof props !== "object") return;

    // Cluster tap: zoom into the cluster so its members spread apart.
    if ("point_count" in props) {
      const source = shapeSourceRef.current;
      const camera = cameraRef.current;
      if (!source || !camera) return;
      if (feature.geometry.type !== "Point") return;
      const [lng, lat] = feature.geometry.coordinates;
      try {
        // iOS's RNMBXShapeSource expects the full feature object — passing
        // the cluster_id string overload is currently broken on iOS (decode
        // error: "Expected Dictionary<String, Any> but found a string").
        const zoom = await source.getClusterExpansionZoom(feature);
        // Bail if we unmounted while the native call was in flight —
        // touching cameraRef after teardown throws `Unknown reactTag`.
        if (!isMountedRef.current) return;
        camera.setCamera({
          centerCoordinate: [lng, lat],
          zoomLevel: zoom,
          animationDuration: 400,
        });
      } catch {
        // getClusterExpansionZoom rejects if the cluster has already been
        // resolved (rare but possible) or we unmounted mid-flight.
      }
      return;
    }

    const slug = typeof props.slug === "string" ? props.slug : null;
    if (!slug) return;

    // Fire the tap-feedback ring before the preview state update so the
    // pulse paints in the same frame as the tap. Reset (null → coord)
    // re-triggers the effect even on rapid repeat taps of the same dot.
    // Pulse color = the dot's own color (set per-feature in the
    // FeatureCollection memo) so emerald/red/gray dots ripple in their
    // own shade instead of clashing with a fixed brand color.
    if (feature.geometry.type === "Point") {
      const [lng, lat] = feature.geometry.coordinates;
      const dotColor =
        typeof props.fillColor === "string" ? props.fillColor : COLOR_DEFAULT;
      setPulseActive(false);
      setPulseColor(dotColor);
      setPulseCoord([lng, lat]);
    }

    // Defer the preview-card state update to the next macrotask. The card
    // mounts in the parent and triggers `useMountainOne` plus a full
    // parent re-render of the map subtree — together that work blocks the
    // JS thread long enough that an in-the-same-tick state flip for the
    // pulse paints ~1s late on Android. Pushing the preview to a 0ms
    // timeout lets React commit the pulse update first, paint the pulse
    // in the next frame, and only then mount the preview.
    const previewPayload: MountainPreview = {
      slug,
      fallback: {
        name: typeof props.name === "string" ? props.name : "",
        height: typeof props.height === "string" ? props.height : "",
        location: typeof props.location === "string" ? props.location : "",
        imageUrl:
          typeof props.imageUrl === "string" ? props.imageUrl : null,
        essential: props.essential === true,
        isSummited: props.isSummited === true,
      },
    };
    setTimeout(() => setPreview(previewPayload), 0);
  };

  // No token = no map. Render an explicit error surface in production so the
  // failure is visible instead of degrading to blank grey tiles.
  if (!MAPBOX_TOKEN) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <ThemedText className="text-center font-medium text-muted-foreground">
          <FormattedMessage defaultMessage="Map unavailable — missing access token." />
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        styleURL={colorScheme === "dark" ? STYLE_DARK : STYLE_LIGHT}
        compassEnabled
        scaleBarEnabled={false}
        attributionEnabled
        // Lock the map to a flat top-down view: no 2-finger tilt into 3D, no
        // rotation. The mountains overview is a discovery surface, not a
        // navigation viewport, and the satellite imagery + cluster markers
        // are easier to read at pitch=0.
        pitchEnabled={false}
        rotateEnabled={false}
        // Logo top-leading, (i) chip bottom-leading (different corners so
        // they don't stack), compass left at its default top-trailing.
        logoPosition={{ top: 8, left: 8 }}
        attributionPosition={{ bottom: 8, left: 8 }}
        // Mute the (i) chip from the SDK's default accent. NOTE: on iOS the
        // tint color of the attribution chip is inherited from the parent
        // UIView's `tintColor`. This MapView-level prop covers most ornaments;
        // if the chip still picks up the app's primary tint, the override
        // needs to happen at a higher level (UIWindow tint).
        tintColor="#737373"
      >
        <Camera
          ref={cameraRef}
          animationMode="easeTo"
          // `defaultSettings` is read once during native init — defines the
          // camera state at mount. With the parent gating the mount on
          // mountains being loaded, this lands directly on the challenge
          // bbox at first paint (no pan-from-default-world animation).
          // Empty-mountains case falls back to a regional centre so the user
          // doesn't see Mapbox's default world view.
          defaultSettings={
            initialBounds
              ? {
                  bounds: {
                    ne: initialBounds.ne,
                    sw: initialBounds.sw,
                    paddingTop: 80,
                    paddingRight: 40,
                    paddingBottom: 80,
                    paddingLeft: 40,
                  },
                }
              : {
                  centerCoordinate: FALLBACK_CENTER,
                  zoomLevel: FALLBACK_ZOOM,
                }
          }
        />
        {/* Register the three mountain glyph PNGs once so the SymbolLayer
            below can reference them by name. RN picks the right @1x/@2x/@3x
            asset automatically based on device pixel density. */}
        <Images
          images={{
            "mtn-default": require("@/assets/images/markers/mountain-default.png"),
            "mtn-summited": require("@/assets/images/markers/mountain-summited.png"),
            "mtn-essential": require("@/assets/images/markers/mountain-essential.png"),
          }}
        />
        {/* Single GeoJSON source with native clustering. Two layers paint
            off it: clusters as solid filled circles with a count label,
            and individual mountains as glyph markers. */}
        <ShapeSource
          ref={shapeSourceRef}
          id={SOURCE_ID}
          shape={featureCollection}
          cluster
          // Aggressively low cluster settings: small catchment so most peaks
          // render as individual dots, and clusters fully dissolve at modest
          // zoom levels.
          clusterRadius={18}
          clusterMaxZoomLevel={9}
          // Aggregate `summitedCount` across each cluster — the second
          // element is the per-feature value (`isSummitedNum`: 0/1), the
          // third the reducer (`+`). At render time we compare it against
          // `point_count` to color fully-completed clusters emerald.
          clusterProperties={{
            summitedCount: ["+", ["get", "isSummitedNum"]],
          }}
          onPress={handlePress}
        >
          <CircleLayer
            id={CLUSTER_LAYER_ID}
            filter={["has", "point_count"]}
            style={{
              // Emerald only when every mountain in the cluster is summited
              // (sum of per-feature flags equals the cluster's `point_count`).
              circleColor: [
                "case",
                [
                  "==",
                  ["get", "summitedCount"],
                  ["get", "point_count"],
                ],
                COLOR_SUMMITED,
                COLOR_CLUSTER,
              ],
              circleStrokeColor: "#ffffff",
              circleStrokeWidth: 2,
              circleRadius: [
                "step",
                ["get", "point_count"],
                14,
                10,
                18,
                50,
                22,
                200,
                28,
              ],
            }}
          />
          <SymbolLayer
            id={CLUSTER_COUNT_LAYER_ID}
            filter={["has", "point_count"]}
            style={{
              textField: ["get", "point_count_abbreviated"],
              textSize: 12,
              textColor: "#ffffff",
              textAllowOverlap: true,
              textIgnorePlacement: true,
            }}
          />
          {/* Un-clustered marker: a tinted mountain glyph instead of a flat
              disc. Three variants by status (summited > essential > default)
              swapped via an `iconImage` case expression — no per-feature
              tinting, so we don't need SDF-encoded assets. `iconAllowOverlap`
              keeps every marker visible at dense zooms; `iconSize` scales
              with zoom so dots stay readable at the world view but don't
              dominate at close zoom. */}
          <SymbolLayer
            id={UNCLUSTERED_LAYER_ID}
            filter={["!", ["has", "point_count"]]}
            style={{
              iconImage: [
                "case",
                ["get", "isSummited"],
                "mtn-summited",
                ["get", "essential"],
                "mtn-essential",
                "mtn-default",
              ],
              iconAllowOverlap: true,
              iconIgnorePlacement: true,
              iconSize: [
                "interpolate",
                ["linear"],
                ["zoom"],
                6,
                0.4,
                10,
                0.6,
                14,
                0.85,
              ],
            }}
          />
        </ShapeSource>

        {/* Tap-feedback ring: a single-feature source that mounts on marker
            tap and unmounts ~400ms later. The layer reads `circleRadius` and
            `circleOpacity` from React state, and Mapbox's *Transition props
            tween between values whenever they change. Result: tap → ring
            grows + fades on the GPU side, no JS-thread Animated loop. The
            source key on `pulseCoord?.join(",")` forces a remount on rapid
            repeat taps so the animation restarts cleanly. */}
        {pulseCoord && (
          <ShapeSource
            key={pulseCoord.join(",")}
            id={TAP_PULSE_SOURCE_ID}
            shape={{
              type: "Feature",
              geometry: { type: "Point", coordinates: pulseCoord },
              properties: {},
            }}
          >
            <CircleLayer
              id={TAP_PULSE_LAYER_ID}
              style={{
                circleColor: pulseColor,
                circleRadius: pulseActive
                  ? TAP_PULSE_END_RADIUS
                  : TAP_PULSE_START_RADIUS,
                circleOpacity: pulseActive ? 0 : 0.6,
                circleRadiusTransition: {
                  duration: TAP_PULSE_DURATION_MS,
                  delay: 0,
                },
                circleOpacityTransition: {
                  duration: TAP_PULSE_DURATION_MS,
                  delay: 0,
                },
              }}
            />
          </ShapeSource>
        )}

        {/* Labels live in a SEPARATE ShapeSource (no onPress, no cluster)
            so tapping a label doesn't bubble up as a marker tap. Same
            FeatureCollection — Mapbox doesn't deduplicate sources, but the
            cost is just one more GeoJSON upload. Filter mirrors the dot
            layer (clusters are dissolved at this zoom anyway) and lives
            below the user-dot in z-order so it never paints over it. */}
        <ShapeSource id={LABEL_SOURCE_ID} shape={featureCollection}>
          <SymbolLayer
            id={LABEL_LAYER_ID}
            minZoomLevel={LABEL_MIN_ZOOM}
            style={{
              textField: ["get", "label"],
              textSize: 11,
              textColor:
                colorScheme === "dark" ? COLOR_LABEL_DARK : COLOR_LABEL_LIGHT,
              // Semibold reads better at small sizes against varied terrain.
              // Mapbox Standard ships this in its glyph atlas; fall back to
              // Arial Unicode for any glyph the primary font lacks.
              textFont: ["Open Sans Semibold", "Arial Unicode MS Bold"],
              textAnchor: "bottom",
              textOffset: [0, -1],
              textAllowOverlap: true,
              textIgnorePlacement: true,
            }}
          />
        </ShapeSource>

        {/* User-location dot rendered AFTER the mountain source so the
            cluster/marker layers don't paint on top of it. Replaces
            @rnmapbox/maps' `Mapbox.UserLocation` (uses RN's `Animated` API
            internally and crashes under NativeTabs' eager-mount lifecycle).
            Coords come from the root `LocationSync` so the dot is in place
            the moment this screen mounts. Two CircleLayers: a translucent
            halo + a solid centre disc, matching iOS Maps' visual idiom. */}
        {userLocation && (
          <ShapeSource
            id={USER_SOURCE_ID}
            shape={{
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [
                  userLocation.coords.longitude,
                  userLocation.coords.latitude,
                ],
              },
              properties: {},
            }}
          >
            <CircleLayer
              id={USER_HALO_LAYER_ID}
              style={{
                circleColor: COLOR_USER_HALO,
                circleRadius: 22,
              }}
            />
            <CircleLayer
              id={USER_DOT_LAYER_ID}
              style={{
                circleColor: COLOR_USER_DOT,
                circleStrokeColor: "#ffffff",
                circleStrokeWidth: 2,
                circleRadius: 7,
              }}
            />
          </ShapeSource>
        )}
      </MapView>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <View className="bg-background/80 rounded-full p-3 shadow-lg">
            <ActivityIndicator size="small" />
          </View>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
  },
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
});
