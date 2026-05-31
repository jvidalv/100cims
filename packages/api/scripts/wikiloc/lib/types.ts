// Source-agnostic types. Even though this scraper is Wikiloc-specific, the
// shape it emits is the same one the app + future scrapers (Strava, Komoot,
// AllTrails) use. Each record carries `source` + `externalId`.

export type RouteSource = "wikiloc";

export type TechnicalDifficulty =
  | "easy"
  | "moderate"
  | "difficult"
  | "very-difficult"
  | "only-experts";

export type TrailType = "loop" | "out-and-back" | "one-way";

export type TrailListEntry = {
  externalId: string;
  url: string;
  title: string;
};

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

export type TrailDetail = {
  source: RouteSource;
  externalId: string;
  // Every mountain (by seed slug) this route actually summits. Populated by
  // the Gemini summit-detection pass. Originating mountain is first;
  // additional summits (for 2x100Cims-style traverses) follow.
  mountainSlugs: string[];
  url: string;
  // Original source-side title (the messy concatenation of waypoints on
  // Wikiloc). Kept so we can re-run the title rewrite without re-scraping.
  titleRaw: string;
  // Localized titles produced by Gemini. Until the rewrite runs, ca/es/en all
  // hold the raw title verbatim so the type stays consistent.
  title: LocalizedString;
  // Author's prose description scraped from <meta name="description">. Used as
  // input to the description rewrite step and kept so we can re-run the
  // rewrite without re-scraping.
  descriptionRaw: string | null;
  // Concise en/ca/es summary produced by Gemini. Null until the rewrite step
  // runs (older scraper output predates this field).
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
