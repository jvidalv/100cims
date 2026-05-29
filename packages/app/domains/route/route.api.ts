import { trails as picaDestatsTrails } from "./data/pica-destats";

import type { MountainRoute } from "./route.types";

// While the data lives in a static .ts file we key it by mountain slug. When
// we move to a server endpoint, only the body of this hook changes — the
// callers don't care.
// NOTE: the DB seeds Pica d'Estats with slug "pica-destats" (no second hyphen),
// not "pica-de-estats". Match the DB.
const ROUTES_BY_MOUNTAIN_SLUG: Record<string, MountainRoute[]> = {
  "pica-destats": picaDestatsTrails,
};

export const useRoutesForMountain = (slug: string | undefined): MountainRoute[] => {
  if (!slug) return [];
  return ROUTES_BY_MOUNTAIN_SLUG[slug] ?? [];
};

export const useRouteByTrailId = (
  slug: string | undefined,
  trailId: string | undefined,
): MountainRoute | undefined => {
  const routes = useRoutesForMountain(slug);
  if (!trailId) return undefined;
  return routes.find((r) => r.externalId === trailId);
};
