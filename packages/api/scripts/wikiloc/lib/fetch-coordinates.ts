import type { Page } from "playwright";

import type { TrailCoordinate } from "./types";

type GeoJsonFeature = {
  type: string;
  geometry?: {
    type: string;
    coordinates: number[] | number[][] | number[][][];
  };
  coordinates?: number[] | number[][] | number[][][];
};

type GeoJsonLike =
  | GeoJsonFeature
  | { type: "FeatureCollection"; features: GeoJsonFeature[] }
  | { type: "LineString"; coordinates: number[][] };

const flattenCoordinates = (input: unknown): TrailCoordinate[] | null => {
  if (!Array.isArray(input) || input.length === 0) return null;
  const first = input[0];
  if (!Array.isArray(first)) return null;
  // LineString = [[lng, lat, ele?], ...] — first[0] is a number.
  // MultiLineString = [[[lng, lat, ele?], ...], ...] — first[0] is an array; recurse + concat.
  if (Array.isArray(first[0])) {
    const out: TrailCoordinate[] = [];
    for (const segment of input as unknown[]) {
      const flat = flattenCoordinates(segment);
      if (flat) out.push(...flat);
    }
    return out.length > 0 ? out : null;
  }
  const out: TrailCoordinate[] = [];
  for (const tuple of input as number[][]) {
    if (tuple.length < 2) continue;
    const [lng, lat, ele] = tuple;
    if (typeof lng !== "number" || typeof lat !== "number") continue;
    out.push({ lat, lng, ele: typeof ele === "number" ? ele : null });
  }
  return out.length > 0 ? out : null;
};

const extractFromGeoJson = (data: GeoJsonLike): TrailCoordinate[] | null => {
  if ("features" in data && Array.isArray(data.features)) {
    for (const feature of data.features) {
      const coords = feature.geometry?.coordinates ?? feature.coordinates;
      const flat = flattenCoordinates(coords);
      if (flat) return flat;
    }
    return null;
  }
  if ("geometry" in data) {
    return flattenCoordinates(data.geometry?.coordinates);
  }
  if ("coordinates" in data) {
    return flattenCoordinates(data.coordinates);
  }
  return null;
};

const tryParseGpx = (gpx: string): TrailCoordinate[] | null => {
  const out: TrailCoordinate[] = [];
  const pointRegex =
    /<trkpt\s+lat="([-\d.]+)"\s+lon="([-\d.]+)"[^>]*>([\s\S]*?)<\/trkpt>/g;
  let match: RegExpExecArray | null;
  while ((match = pointRegex.exec(gpx)) !== null) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (Number.isNaN(lat) || Number.isNaN(lng)) continue;
    const eleMatch = match[3].match(/<ele>([-\d.]+)<\/ele>/);
    const ele = eleMatch ? parseFloat(eleMatch[1]) : NaN;
    out.push({ lat, lng, ele: Number.isNaN(ele) ? null : ele });
  }
  return out.length > 0 ? out : null;
};

export const interceptCoordinatesDuringNav = async (
  page: Page,
  navUrl: string,
): Promise<TrailCoordinate[] | null> => {
  let captured: TrailCoordinate[] | null = null;
  // Tightened URL filter: only inspect requests whose path strongly suggests a
  // trail payload. The previous "any application/json" net read dozens of
  // analytics XHR bodies inline, adding seconds per page.
  const looksLikeTrailPayload = (url: string): boolean =>
    /(geojson|mapservices|trail.*\.json|coordinates|wikiloc\.com\/.*\/(trail|track))/i.test(
      url,
    );

  const onResponse = async (response: import("playwright").Response): Promise<void> => {
    if (captured) return;
    if (!response.ok()) return;
    if (!looksLikeTrailPayload(response.url())) return;
    try {
      const body = await response.text();
      if (!body || body.length < 50) return;
      if (!body.includes("coordinates") && !body.includes("[[")) return;
      const json: unknown = JSON.parse(body);
      const flat = extractFromGeoJson(json as GeoJsonLike);
      if (flat && flat.length > 10) {
        captured = flat;
      }
    } catch {
      // ignore — not JSON or not a coord payload
    }
  };
  page.on("response", onResponse);

  try {
    const response = await page.goto(navUrl, {
      waitUntil: "networkidle",
      timeout: 60_000,
    });
    if (!response || response.status() >= 400) {
      throw new Error(`Trail page nav failed: ${response?.status() ?? "no response"}`);
    }
  } finally {
    // Always detach so later evaluate() calls on the same page don't keep
    // accumulating body reads or overwrite `captured` from unrelated XHRs.
    page.off("response", onResponse);
  }

  if (captured) return captured;

  // Wikiloc exposes the polyline directly as window.geojson (FeatureCollection)
  // and window.coordinates (array of [lng, lat, ele] tuples). No XHR involved.
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const fn = new Function(
    "return (function () {" +
      "var out = null;" +
      "if (window.coordinates && typeof window.coordinates === 'object') {" +
      "  out = { coordinates: Array.from(window.coordinates) };" +
      "} else if (window.geojson && typeof window.geojson === 'object') {" +
      "  out = { geojson: window.geojson };" +
      "}" +
      "return out;" +
      "})",
  )() as () => { coordinates?: unknown; geojson?: unknown } | null;
  const fromGlobals = await page.evaluate(fn);
  if (fromGlobals) {
    if (fromGlobals.coordinates) {
      const flat = flattenCoordinates(fromGlobals.coordinates);
      if (flat) return flat;
    }
    if (fromGlobals.geojson) {
      const flat = extractFromGeoJson(fromGlobals.geojson as GeoJsonLike);
      if (flat) return flat;
    }
  }

  return null;
};

export const tryFetchGpx = async (
  page: Page,
  externalId: string,
): Promise<TrailCoordinate[] | null> => {
  // Wikiloc exposes a public download endpoint. May require auth on some trails;
  // if it does, we fall through to null and the caller can rely on the
  // intercepted GeoJSON.
  const gpxUrl = `https://www.wikiloc.com/wikiloc/download.do?event=download&id=${externalId}&format=gpx`;
  try {
    const response = await page.context().request.get(gpxUrl, {
      timeout: 30_000,
      headers: { Accept: "application/gpx+xml,application/xml,text/xml,*/*" },
    });
    if (!response.ok()) return null;
    const contentType = response.headers()["content-type"] ?? "";
    if (!/xml|gpx/i.test(contentType)) return null;
    const text = await response.text();
    return tryParseGpx(text);
  } catch {
    return null;
  }
};
