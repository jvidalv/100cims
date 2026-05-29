// Source-agnostic route shape. The fields don't reference any specific
// provider — `source` + `externalId` identify the origin so we can later
// pull from Strava / Komoot / AllTrails without changing this type.
// Once the routes endpoint lands we'll generate this from the OpenAPI
// schema instead of hand-mirroring it from the scraper.

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
  source: RouteSource;
  externalId: string;
  url: string;
  // Original source-side title (long & messy). Kept so we can fall back if
  // the localized object isn't populated yet.
  titleRaw: string;
  // Localized titles produced by Gemini at scrape time.
  title: LocalizedString;
  descriptionRaw: string | null;
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
