// Server-side enum narrowing for route fields. The DB columns are plain
// `text` so future values don't need a migration, but the response schema
// is tightened to a union. Filter through these helpers before the row
// hits the response validator so the wire shape always matches the schema
// and the OpenAPI-generated client types stay precise.

export type RouteSource = "wikiloc";
export type TechnicalDifficulty =
  | "easy"
  | "moderate"
  | "difficult"
  | "very-difficult"
  | "only-experts";
export type TrailType = "loop" | "out-and-back" | "one-way";

const ROUTE_SOURCES: readonly RouteSource[] = ["wikiloc"];
const TECHNICAL_DIFFICULTIES: readonly TechnicalDifficulty[] = [
  "easy",
  "moderate",
  "difficult",
  "very-difficult",
  "only-experts",
];
const TRAIL_TYPES: readonly TrailType[] = ["loop", "out-and-back", "one-way"];

const matchOrNull = <T extends string>(
  value: string | null,
  allowed: readonly T[],
): T | null => {
  if (value === null) return null;
  return (allowed as readonly string[]).includes(value) ? (value as T) : null;
};

// Returns null for unknown sources — matches the technicalDifficulty /
// trailType sanitisers. A silent fallback to a fixed known value would
// mask future provider drift (a Strava row would deeplink to wikiloc.com
// and admins couldn't see the bad value). Source is rendered as a chip in
// the UI, not used in switch/case logic, so null is a safer surface than
// a fake-but-known value.
export const sanitizeSource = (value: string | null): RouteSource | null =>
  matchOrNull(value, ROUTE_SOURCES);

export const sanitizeTechnicalDifficulty = (
  value: string | null,
): TechnicalDifficulty | null => matchOrNull(value, TECHNICAL_DIFFICULTIES);

export const sanitizeTrailType = (value: string | null): TrailType | null =>
  matchOrNull(value, TRAIL_TYPES);
