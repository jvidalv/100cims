import type { TrailDetail } from "./types";

// Geometric sanity check: for each claimed summit, verify the trail's GPS
// track actually passes near it. A "summit" claim that the GPS track never
// gets within MAX_DISTANCE_M of is almost certainly a Gemini hallucination
// (the description mentioned the peak in some "view from" or "near" context,
// not as a destination).
//
// The originating mountain — the one we searched Wikiloc for — is treated
// more leniently because some Wikiloc trails have a sparse GPS track that
// doesn't perfectly reach the summit dot. We only drop the originating
// mountain when the closest GPS point is >MAX_DISTANCE_LENIENT_M away.

const MAX_DISTANCE_M = 200;
const MAX_DISTANCE_LENIENT_M = 600;

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

export type SummitCandidate = {
  slug: string;
  latitude: number;
  longitude: number;
};

/**
 * Returns the subset of claimedSlugs whose mountain coordinates pass the
 * proximity check against the trail's GPS track. Originating mountain (the
 * first slug in the input list) uses a lenient threshold; other claimed
 * summits use the strict threshold.
 */
export const filterSummitsByGeometry = (
  trail: TrailDetail,
  claimedSlugs: string[],
  catalog: SummitCandidate[],
): {
  kept: string[];
  rejected: { slug: string; closestM: number }[];
} => {
  // No GPS track → can't verify, return claims unchanged. Better than
  // silently dropping everything.
  if (!trail.coordinates || trail.coordinates.length === 0) {
    return { kept: claimedSlugs, rejected: [] };
  }
  const trailPoints = trail.coordinates.map((c) => ({ lat: c.lat, lng: c.lng }));
  const bySlug = new Map(catalog.map((c) => [c.slug, c]));

  const kept: string[] = [];
  const rejected: { slug: string; closestM: number }[] = [];
  for (let i = 0; i < claimedSlugs.length; i++) {
    const slug = claimedSlugs[i];
    const peak = bySlug.get(slug);
    if (!peak) {
      // Slug not in catalog → can't verify, drop defensively. This shouldn't
      // happen since detect-summits already filters to catalogued slugs.
      rejected.push({ slug, closestM: NaN });
      continue;
    }
    const d = closestPointDistance(trailPoints, {
      lat: peak.latitude,
      lng: peak.longitude,
    });
    const threshold = i === 0 ? MAX_DISTANCE_LENIENT_M : MAX_DISTANCE_M;
    if (d <= threshold) {
      kept.push(slug);
    } else {
      rejected.push({ slug, closestM: Math.round(d) });
    }
  }
  return { kept, rejected };
};
