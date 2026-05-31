// Even-stride downsample for the route list thumbnails. The full GPS track
// stored on `route.coordinates` is usually 1-3k points; rendering that on
// an 80×80 Mapbox tile is wasteful both for payload and for the renderer
// itself. ~50 points is plenty to recognise the shape of a polyline at
// that size. First + last point are always kept so the polyline reaches
// the trailhead/summit.

const LIST_COORDINATES_MAX = 50;

type Coord = { lat: number; lng: number; ele?: number };

export const downsampleCoordsForList = (
  coords: Coord[] | null,
): Coord[] | null => {
  if (!coords) return null;
  // Always return a fresh array so callers can't mutate the Drizzle result
  // row through the return value. The downsampled branch already builds a
  // new array; matching that here keeps the contract uniform.
  if (coords.length <= LIST_COORDINATES_MAX) return [...coords];
  const step = coords.length / LIST_COORDINATES_MAX;
  const last = coords[coords.length - 1];
  if (last === undefined) return coords;
  const out: Coord[] = [];
  for (let i = 0; i < LIST_COORDINATES_MAX; i++) {
    const idx = Math.min(coords.length - 1, Math.floor(i * step));
    const point = coords[idx];
    if (point !== undefined) out.push(point);
  }
  if (out.length > 0) out[out.length - 1] = last;
  return out;
};
