import type { TechnicalDifficulty, TrailType } from "./types";

const MILES_TO_METERS = 1609.344;
const KILOMETERS_TO_METERS = 1000;
const FEET_TO_METERS = 0.3048;

export const parseDistance = (raw: string): number | null => {
  const text = raw.trim().toLowerCase();
  const match = text.match(/([\d,.]+)\s*(mi|km|m)\b/);
  if (!match) return null;
  const value = parseFloat(match[1].replace(/,/g, ""));
  if (Number.isNaN(value)) return null;
  switch (match[2]) {
    case "mi":
      return Math.round(value * MILES_TO_METERS);
    case "km":
      return Math.round(value * KILOMETERS_TO_METERS);
    case "m":
      return Math.round(value);
    default:
      return null;
  }
};

export const parseElevation = (raw: string): number | null => {
  const text = raw.trim().toLowerCase();
  const match = text.match(/([\d,.]+)\s*(ft|m)\b/);
  if (!match) return null;
  const value = parseFloat(match[1].replace(/,/g, ""));
  if (Number.isNaN(value)) return null;
  return match[2] === "ft"
    ? Math.round(value * FEET_TO_METERS)
    : Math.round(value);
};

export const parseDuration = (raw: string): number | null => {
  const text = raw.trim().toLowerCase();
  let total = 0;
  let matched = false;
  const hours = text.match(/(\d+)\s*hour/);
  if (hours) {
    total += parseInt(hours[1], 10) * 3600;
    matched = true;
  }
  const minutes = text.match(/(\d+)\s*minute/);
  if (minutes) {
    total += parseInt(minutes[1], 10) * 60;
    matched = true;
  }
  const seconds = text.match(/(\d+)\s*second/);
  if (seconds) {
    total += parseInt(seconds[1], 10);
    matched = true;
  }
  return matched ? total : null;
};

export const parseInteger = (raw: string): number | null => {
  const cleaned = raw.replace(/[^\d-]/g, "");
  if (!cleaned) return null;
  const value = parseInt(cleaned, 10);
  return Number.isNaN(value) ? null : value;
};

export const parseTechnicalDifficulty = (
  raw: string,
): TechnicalDifficulty | null => {
  const text = raw.trim().toLowerCase();
  if (text.includes("only")) return "only-experts";
  if (text.includes("very")) return "very-difficult";
  if (text.includes("difficult")) return "difficult";
  if (text.includes("moderate")) return "moderate";
  if (text.includes("easy")) return "easy";
  return null;
};

export const parseTrailType = (raw: string): TrailType | null => {
  const text = raw.trim().toLowerCase();
  if (text.includes("loop")) return "loop";
  if (text.includes("out") || text.includes("back")) return "out-and-back";
  if (text.includes("one")) return "one-way";
  return null;
};

export const parseUploadedDate = (raw: string): string | null => {
  const parsed = new Date(raw.trim());
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
};

export const parseRecordedMonth = (raw: string): string | null => {
  const text = raw.trim();
  if (!text) return null;
  const parsed = new Date(`${text} 1`);
  if (Number.isNaN(parsed.getTime())) return text;
  const year = parsed.getUTCFullYear();
  const month = String(parsed.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

export const extractWikilocTrailIdFromUrl = (url: string): string | null => {
  // Wikiloc trail URLs end with `-<id>` then optionally `/`, `/photos`, `?…`, `#…`.
  // Grab the last digit run preceded by a `-` so we never pick a digit substring
  // out of the slug itself.
  const match = url.match(/-(\d+)(?:[/?#]|$)/);
  return match ? match[1] : null;
};
