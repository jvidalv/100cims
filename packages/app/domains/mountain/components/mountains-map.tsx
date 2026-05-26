import Mapbox, {
  Camera,
  CircleLayer,
  MapView,
  ShapeSource,
  SymbolLayer,
} from "@rnmapbox/maps";
import { useColorScheme } from "nativewind";
import { useCallback, useEffect, useMemo, useRef } from "react";
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

// Mapbox Standard is their newer 3D vector style — richer terrain shading,
// hillshades, contour lines and peak labels than Outdoors v12. Standard has
// a built-in light/dark/dusk/dawn config, but @rnmapbox/maps 10.x doesn't
// expose the style-config API yet, so we fall back to the classic `dark-v11`
// when the app is in dark mode for a clearly-dark basemap.
const STYLE_LIGHT = "mapbox://styles/mapbox/standard";
const STYLE_DARK = "mapbox://styles/mapbox/dark-v11";

const COLOR_SUMMITED = "#10b981";
const COLOR_ESSENTIAL = Colors.light.primary;
const COLOR_DEFAULT = "#6b7280";
const COLOR_CLUSTER = "#000000";

const SOURCE_ID = "mountains";
const CLUSTER_LAYER_ID = "mountains-cluster";
const CLUSTER_COUNT_LAYER_ID = "mountains-cluster-count";
const UNCLUSTERED_LAYER_ID = "mountains-unclustered";
const LABEL_LAYER_ID = "mountains-label";

const USER_SOURCE_ID = "user-location";
const USER_HALO_LAYER_ID = "user-location-halo";
const USER_DOT_LAYER_ID = "user-location-dot";
// Standard iOS Maps blue dot — Apple uses #007AFF for the centre disc and a
// translucent variant for the surrounding halo.
const COLOR_USER_DOT = "#007AFF";
const COLOR_USER_HALO = "rgba(0, 122, 255, 0.2)";

// Fallback frame on cold start when neither mountains nor user-location are
// available yet. Centred on Catalonia.
const FALLBACK_CENTER: [number, number] = [1.8, 41.8];
const FALLBACK_ZOOM = 7;

// Half-edge in degrees that we expand zero-area bboxes by so a single-mountain
// filter doesn't collapse the camera to an undefined zoom. ~5km on either side
// at our latitudes — enough that Mapbox picks a reasonable zoom for one peak.
const SINGLE_POINT_PADDING = 0.05;

// On-marker label settings — kept here so the magic numbers are in one place.
// `LABEL_MIN_ZOOM` is the zoom at which the per-marker name/height tag becomes
// visible; below this the map is too dense for labels to read.
const LABEL_NAME_MAX = 18;
// Zoom at which the per-marker label appears. Set just below
// cluster-dissolve (zoom 9) so labels start showing as soon as the cluster
// disks split apart.
const LABEL_MIN_ZOOM = 8;
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

  // Imperative camera control. Re-fits on every `mountainsKey` change so
  // narrowing the filter (search query, Essentials toggle, altitude band)
  // re-frames the camera on the new set. The original implementation fitted
  // only ONCE because re-fitting on every mountainsKey change yanked the
  // camera mid-pan; in practice mountainsKey doesn't change while the user
  // is panning (it changes when filter chips or the search input do), so
  // the trade-off favours re-fitting. The hide-the-map (display:none)
  // toggle in the parent doesn't change `mountainsKey`, so the effect
  // doesn't fire while the map is hidden.
  useEffect(() => {
    const camera = cameraRef.current;
    if (!camera) return;

    if (mountains.length === 0) {
      const fallback: [number, number] = userLocation
        ? [userLocation.coords.longitude, userLocation.coords.latitude]
        : FALLBACK_CENTER;
      camera.setCamera({
        centerCoordinate: fallback,
        zoomLevel: userLocation ? 9 : FALLBACK_ZOOM,
        animationDuration: 0,
      });
      return;
    }

    const lats = mountains.map((m) => parseFloat(m.latitude));
    const lngs = mountains.map((m) => parseFloat(m.longitude));
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    // Single-mountain (or all-same-location) collapse — fitBounds on a
    // zero-area bbox is platform-dependent. Centre on the point at a
    // sensible zoom instead.
    if (maxLat - minLat < 1e-6 && maxLng - minLng < 1e-6) {
      camera.setCamera({
        centerCoordinate: [
          (minLng + maxLng) / 2,
          (minLat + maxLat) / 2,
        ],
        zoomLevel: 11,
        animationDuration: 500,
      });
      return;
    }

    // Pad zero-axis collapses (e.g. all mountains on the same latitude) so
    // fitBounds still has a bbox to work with.
    const nePadded: [number, number] = [
      maxLng + (maxLng - minLng < 1e-6 ? SINGLE_POINT_PADDING : 0),
      maxLat + (maxLat - minLat < 1e-6 ? SINGLE_POINT_PADDING : 0),
    ];
    const swPadded: [number, number] = [
      minLng - (maxLng - minLng < 1e-6 ? SINGLE_POINT_PADDING : 0),
      minLat - (maxLat - minLat < 1e-6 ? SINGLE_POINT_PADDING : 0),
    ];

    camera.fitBounds(nePadded, swPadded, [80, 40, 80, 40], 500);
    // mountains/userLocation reference changes are captured by mountainsKey;
    // depending on the array directly would re-fit on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mountainsKey]);

  const handlePress = async (event: { features: GeoJSON.Feature[] }) => {
    // Any tap on a marker (or cluster) should drop the keyboard if the user
    // was typing in the search input — otherwise the keyboard hides the
    // preview card that's about to slide up.
    Keyboard.dismiss();
    const feature = event.features[0];
    const props = feature?.properties;
    if (!feature || !props || typeof props !== "object") return;

    // Cluster tap: zoom into the cluster so its members spread apart.
    if (props.cluster === true) {
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

    // Open the floating preview card. Fallback fields are pulled from the
    // marker's GeoJSON properties so the card renders instantly; the card
    // itself fires `useMountainOne` to enrich with full data + cache-warm
    // the detail page in case the user taps through.
    setPreview({
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
    });
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
        <Camera ref={cameraRef} animationMode="easeTo" />
        {/* Single GeoJSON source with native clustering. Two layers paint
            off it: clusters as solid filled circles with a count label,
            and individual mountains as smaller colored dots. */}
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
          <CircleLayer
            id={UNCLUSTERED_LAYER_ID}
            filter={["!", ["has", "point_count"]]}
            style={{
              // Fill = essential-or-default (set in the FeatureCollection
              // memo). Border = essential | summited | default.
              circleColor: ["get", "fillColor"],
              circleStrokeColor: ["get", "strokeColor"],
              circleStrokeWidth: 3,
              circleRadius: 7,
            }}
          />
          {/* On-marker label: "Name (Xm)", visible from LABEL_MIN_ZOOM
              upwards (clusters dissolve at zoom 9, labels appear once peaks
              are spread out enough to read). Anchored at the BOTTOM of the
              label so it sits ABOVE the dot, with a generous offset for
              breathing room. Single solid color, no halo. */}
          <SymbolLayer
            id={LABEL_LAYER_ID}
            filter={["!", ["has", "point_count"]]}
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
              textOffset: [0, -1.4],
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
