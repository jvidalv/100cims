import { t } from "elysia";

import { MountainSchema } from "@/api/schemas/mountain.schema";

// Locale-keyed string shape. Matches the `LocalizedString` type defined in
// the schema; declared in TypeBox here so route schemas stay self-contained.
export const LocalizedStringSchema = t.Object({
  en: t.String(),
  ca: t.String(),
  es: t.String(),
});

export const RouteCoordinateSchema = t.Object({
  lat: t.Number(),
  lng: t.Number(),
  ele: t.Optional(t.Number()),
});

// Enum-like fields are narrowed at the response boundary so OpenAPI
// generation produces the exact union on the client — no runtime parse
// step needed downstream. Stays string-shaped on the DB column so future
// values don't require a migration; values outside the union get filtered
// out at the API edge if they ever leak in.
export const RouteSourceSchema = t.Union([t.Literal("wikiloc")]);
export const TechnicalDifficultySchema = t.Union([
  t.Literal("easy"),
  t.Literal("moderate"),
  t.Literal("difficult"),
  t.Literal("very-difficult"),
  t.Literal("only-experts"),
]);
export const TrailTypeSchema = t.Union([
  t.Literal("loop"),
  t.Literal("out-and-back"),
  t.Literal("one-way"),
]);

// List view: everything the routes-list screen needs. Includes a heavily
// downsampled coordinate track so the RouteMap thumbnail on each row can
// render the polyline — ~50 points is plenty for an 80×80 tile and keeps
// the payload small. The full-fidelity GPS track lives on /one.
// titleRaw IS included — the mobile list screen searches against it (the
// raw author title often carries place names the Gemini-rewritten title
// dropped) and the title-fallback chain in pickLocalizedTitle expects it
// as last resort.
export const RouteListItemSchema = t.Object({
  id: t.String(),
  externalId: t.String(),
  source: t.Nullable(RouteSourceSchema),
  url: t.String(),
  title: LocalizedStringSchema,
  titleRaw: t.String(),
  description: t.Nullable(LocalizedStringSchema),
  author: t.Nullable(t.String()),
  distanceMeters: t.Nullable(t.Number()),
  elevationGainMeters: t.Nullable(t.Number()),
  elevationLossMeters: t.Nullable(t.Number()),
  maxElevationMeters: t.Nullable(t.Number()),
  minElevationMeters: t.Nullable(t.Number()),
  technicalDifficulty: t.Nullable(TechnicalDifficultySchema),
  trailType: t.Nullable(TrailTypeSchema),
  movingTimeSeconds: t.Nullable(t.Number()),
  totalTimeSeconds: t.Nullable(t.Number()),
  coordinatesCount: t.Nullable(t.Number()),
  uploadedAt: t.Nullable(t.String()),
  recordedAt: t.Nullable(t.String()),
  // Full mountain records for every summit the route hits, ordered by the
  // geometric detector's closest-approach `ordinal` so the originating /
  // primary peak comes first. Embedded (vs. just a slug array) so consumers
  // don't have to round-trip through `useMountains` to render summit rows.
  mountains: t.Array(MountainSchema),
  // Sparse polyline for the list-row thumbnail (~50 points). null when the
  // route has no GPS data at all.
  coordinates: t.Nullable(t.Array(RouteCoordinateSchema)),
});

// Detail view: same as list + full GPS track (replacing the sparse one)
// + the raw author description.
export const RouteDetailSchema = t.Composite([
  RouteListItemSchema,
  t.Object({
    descriptionRaw: t.Nullable(t.String()),
  }),
]);
