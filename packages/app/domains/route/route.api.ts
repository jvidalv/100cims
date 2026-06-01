import { useQuery } from "@tanstack/react-query";

import apiClient from "@/lib/api-client";
import { routeKeys } from "@/lib/query-keys";

import type { MountainRoute, TrailCoordinate } from "./route.types";

// Routes are served by Postgres behind the auth-only protected tree
// (/api/protected/routes/*). Both endpoints are auth-gated; the consumer
// screens redirect to /join when the user isn't signed in.
//
// Server-side schemas (route.schema.ts on the API) already narrow the
// enum-like fields (source / technicalDifficulty / trailType) to literal
// unions before responding, so apiClient.GET's inferred types are the
// authoritative shape — no client-side parse step needed. The only
// massaging left is normalising `coordinates[].ele` (optional in the
// schema, non-optional in our local type).

// One page is more than enough for any single mountain — even the busiest
// peaks max out at ~12 catalogued routes. We just ask for a generous page
// and let the server cap.
const MOUNTAIN_PAGE_SIZE = 100;

const normaliseCoordinates = (
  coords:
    | { lat: number; lng: number; ele?: number | null | undefined }[]
    | null
    | undefined,
): TrailCoordinate[] | null =>
  coords
    ? coords.map((c) => ({ lat: c.lat, lng: c.lng, ele: c.ele ?? null }))
    : null;

export const useRoutesForMountain = (slug: string | undefined) => {
  return useQuery({
    queryKey: routeKeys.byMountain(slug ?? ""),
    queryFn: async (): Promise<MountainRoute[]> => {
      if (!slug) return [];
      const { data, error } = await apiClient.GET(
        "/api/protected/routes/list",
        {
          params: {
            query: { mountainSlug: slug, pageSize: MOUNTAIN_PAGE_SIZE },
          },
        },
      );
      if (error) throw error;
      // List rows carry a sparse polyline (~50 points) for the thumbnail
      // map; the full GPS track + descriptionRaw are only on /one. Default
      // BEFORE the spread so any future server-side addition of these
      // fields wins automatically.
      return data.message.items.map((r) => ({
        descriptionRaw: null,
        ...r,
        coordinates: normaliseCoordinates(r.coordinates),
      }));
    },
    enabled: Boolean(slug),
    staleTime: 10000 * 60 * 60,
    refetchOnWindowFocus: false,
  });
};

// Routes are addressable by either the DB uuid or the Wikiloc external id.
// The list endpoint returns DB ids in `id`; pre-migration share deeplinks
// used externalId, so the /one handler accepts both and we just pass the
// caller's identifier through.
export const useRouteById = (id: string | undefined) => {
  return useQuery({
    queryKey: routeKeys.one(id ?? ""),
    queryFn: async (): Promise<MountainRoute> => {
      if (!id) throw new Error("route id required");
      const { data, error } = await apiClient.GET(
        "/api/protected/routes/one",
        {
          params: { query: { id } },
        },
      );
      if (error) throw error;
      return {
        ...data.message,
        coordinates: normaliseCoordinates(data.message.coordinates),
      };
    },
    enabled: Boolean(id),
    staleTime: 10000 * 60 * 60,
    refetchOnWindowFocus: false,
  });
};
