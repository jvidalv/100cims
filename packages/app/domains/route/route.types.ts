// Source-agnostic route shape. The fields don't reference any specific
// provider — `source` + `externalId` identify the origin so we can later
// pull from Strava / Komoot / AllTrails without changing this type.
// Once the routes endpoint lands we'll generate this from the OpenAPI
// schema instead of hand-mirroring it from the scraper.

import type { MountainData } from "@/types/mountain";

export type RouteSource = "wikiloc";

export type TechnicalDifficulty =
  | "easy"
  | "moderate"
  | "difficult"
  | "very-difficult"
  | "only-experts";

export type TrailType = "loop" | "out-and-back" | "one-way";

export type TrailCoordinate = {
  lat: number;
  lng: number;
  ele: number | null;
};

export type LocalizedString = {
  en: string;
  ca: string;
  es: string;
};

export type MountainRoute = {
  // Server-side DB id (uuid). Used for navigation + route-detail lookup.
  // Only populated on routes that came from the API; legacy file-based
  // routes don't have one — kept optional for compile-time safety during
  // the transition.
  id?: string;
  // Null when the server can't identify the route's source (unknown value
  // in the DB column). The mobile UI just hides the source chip in that
  // case — preferable to a silent "wikiloc" fallback that would mislead.
  source: RouteSource | null;
  externalId: string;
  // Full mountain records for every summit the route hits, ordered by the
  // server's geometric `ordinal` so the originating/primary peak is first.
  // Single-mountain routes have one entry; "Tosseta Rasa + La Miranda de
  // Terranyes" style 2x100Cims traverses have multiple. Embedded (vs. just
  // slugs) so consumers can render summit rows without a `useMountains`
  // round-trip.
  mountains: MountainData[];
  url: string;
  // Original source-side title (long & messy). Kept so we can fall back if
  // the localized object isn't populated yet.
  titleRaw: string;
  // Localized titles produced by Gemini at scrape time.
  title: LocalizedString;
  // Author's original prose, verbatim from Wikiloc's <meta description>.
  // Kept so we can re-run the rewrite without re-scraping.
  descriptionRaw: string | null;
  // Concise summary in en/ca/es produced by Gemini at scrape time. Null on
  // older scraper output that pre-dates this field; the screen falls back
  // to descriptionRaw in that case.
  description: LocalizedString | null;
  author: string | null;
  distanceMeters: number | null;
  elevationGainMeters: number | null;
  elevationLossMeters: number | null;
  maxElevationMeters: number | null;
  minElevationMeters: number | null;
  technicalDifficulty: TechnicalDifficulty | null;
  trailType: TrailType | null;
  movingTimeSeconds: number | null;
  totalTimeSeconds: number | null;
  coordinatesCount: number | null;
  uploadedAt: string | null;
  recordedAt: string | null;
  coordinates: TrailCoordinate[] | null;
};
