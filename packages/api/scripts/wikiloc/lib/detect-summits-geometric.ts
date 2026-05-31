import type { TrailDetail } from "./types";

// Pure-geometry summit detection. For each trail we scan its GPS track and
// any catalogued mountain whose coordinates the track passes near is
// considered a summit. No LLM, no description parsing — coordinates are the
// ground truth.
//
// 200m covers GPS noise + summit-marker accuracy + "hiker stood near the
// cairn, not on the precise summit pixel". Applied uniformly to every peak
// including the originating one — an earlier 800m allowance for origins
// caused false positives (a trail surfaced by Wikiloc for Pic de Baborte
// whose track only reached 540m from the summit but actually summits Pica
// d'Estats). If the GPS doesn't reach the summit, don't credit it.
const SUMMIT_THRESHOLD_M = 200;

const haversineM = (
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number => {
  const R = 6_371_000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLat = lat2 - lat1;
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

const closestPointDistance = (
  trail: { lat: number; lng: number }[],
  summit: { lat: number; lng: number },
): number => {
  let min = Infinity;
  for (const p of trail) {
    const d = haversineM(p, summit);
    if (d < min) min = d;
  }
  return min;
};

export type CatalogPeak = {
  slug: string;
  latitude: number;
  longitude: number;
};

// First-pass bounding box filter so we don't run haversine on 1300 peaks
// per trail. A 0.3° box (~33km square) is wider than any single Wikiloc
// trail so we never falsely exclude a candidate.
const TRAIL_BBOX_PAD_DEG = 0.3;

const peaksInTrailBbox = (
  trail: { lat: number; lng: number }[],
  catalog: CatalogPeak[],
): CatalogPeak[] => {
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;
  for (const p of trail) {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lng < minLng) minLng = p.lng;
    if (p.lng > maxLng) maxLng = p.lng;
  }
  minLat -= TRAIL_BBOX_PAD_DEG;
  maxLat += TRAIL_BBOX_PAD_DEG;
  minLng -= TRAIL_BBOX_PAD_DEG;
  maxLng += TRAIL_BBOX_PAD_DEG;
  return catalog.filter(
    (p) =>
      p.latitude >= minLat &&
      p.latitude <= maxLat &&
      p.longitude >= minLng &&
      p.longitude <= maxLng,
  );
};

/**
 * Detect which catalogued mountains the trail summits. Pure geometry — no
 * LLM, no title/description parsing. Returns slugs ordered by closest
 * approach distance. When the originating mountain qualifies it lands at
 * the front naturally (distance is typically <50m to the summit dot the
 * Wikiloc search was anchored on).
 *
 * No-coords trails fall back to [originatingSlug]: we have no geometric
 * evidence either way, so we trust Wikiloc's own attribution rather than
 * dropping the trail entirely. Callers that need strict geometric proof
 * should filter out no-coords trails upstream.
 */
export const detectSummitsGeometric = (
  trail: TrailDetail,
  originatingSlug: string,
  catalog: CatalogPeak[],
): string[] => {
  if (!trail.coordinates || trail.coordinates.length === 0) {
    return [originatingSlug];
  }
  const trailPoints = trail.coordinates.map((c) => ({
    lat: c.lat,
    lng: c.lng,
  }));

  // Bbox pre-filter so we only haversine the ~30 peaks within range.
  const candidates = peaksInTrailBbox(trailPoints, catalog);

  type Match = { slug: string; distM: number };
  const matches: Match[] = [];
  for (const peak of candidates) {
    const distM = closestPointDistance(trailPoints, {
      lat: peak.latitude,
      lng: peak.longitude,
    });
    if (distM <= SUMMIT_THRESHOLD_M) {
      matches.push({ slug: peak.slug, distM });
    }
  }
  matches.sort((a, b) => a.distM - b.distM);
  return matches.map((m) => m.slug);
};
