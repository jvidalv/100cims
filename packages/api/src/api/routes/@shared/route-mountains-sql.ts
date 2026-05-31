import { sql } from "drizzle-orm";

// Mountain shape exposed on route responses. Mirrors MountainSchema in
// /api/schemas/mountain.schema.ts — TypeBox enforces the wire shape, we
// just have to make the SQL return matching JSON.
type RouteMountain = {
  id: string;
  name: string;
  slug: string;
  location: string;
  essential: boolean;
  height: string;
  latitude: string;
  longitude: string;
  imageUrl: string | null;
  avgFamilyFriendly: number | null;
  familyRatingCount: number;
  avgDogFriendly: number | null;
  dogRatingCount: number;
  avgDifficulty: number | null;
  difficultyRatingCount: number;
};

// Correlated subquery returning the FULL mountain rows that a route summits,
// ordered by mountain_route.ordinal so the originating/primary peak comes
// first. Returns `[]` for a route with no joined mountains rather than null
// so consumers don't need a null guard.
//
// Columns are explicitly qualified to disambiguate from the outer `route`
// scope — drizzle's `sql\`...\`` template doesn't auto-alias bare column
// references, so leaving `"id"` unqualified made Postgres reject the query
// with `column reference "id" is ambiguous`.
//
// `height`/`latitude`/`longitude` are `numeric()` columns. JSONB_BUILD_OBJECT
// serialises them as JSON NUMBERS by default, but MountainSchema (and every
// existing consumer of MountainData) types them as strings. Casting to ::text
// before nesting in JSON keeps the wire shape consistent — the regular
// Drizzle SELECT path returns numerics as strings already, so this matches.
export const routeMountainsSql = sql<RouteMountain[]>`(
  SELECT COALESCE(
    JSONB_AGG(
      JSONB_BUILD_OBJECT(
        'id', "mountain"."id",
        'name', "mountain"."name",
        'slug', "mountain"."slug",
        'location', "mountain"."location",
        'essential', "mountain"."essential",
        'height', "mountain"."height"::text,
        'latitude', "mountain"."latitude"::text,
        'longitude', "mountain"."longitude"::text,
        'imageUrl', "mountain"."image_url",
        'avgFamilyFriendly', "mountain"."avg_family_friendly",
        'familyRatingCount', "mountain"."family_rating_count",
        'avgDogFriendly', "mountain"."avg_dog_friendly",
        'dogRatingCount', "mountain"."dog_rating_count",
        'avgDifficulty', "mountain"."avg_difficulty",
        'difficultyRatingCount', "mountain"."difficulty_rating_count"
      )
      ORDER BY "mountain_route"."ordinal" ASC
    ),
    '[]'::jsonb
  )
  FROM "mountain_route"
  JOIN "mountain" ON "mountain"."slug" = "mountain_route"."mountain_slug"
  WHERE "mountain_route"."route_id" = "route"."id"
)`;
