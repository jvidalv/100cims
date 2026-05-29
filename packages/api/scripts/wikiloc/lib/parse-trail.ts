import type { Page } from "playwright";

import type { TrailDetail } from "./types";
import {
  extractWikilocTrailIdFromUrl,
  parseDistance,
  parseDuration,
  parseElevation,
  parseInteger,
  parseRecordedMonth,
  parseTechnicalDifficulty,
  parseTrailType,
  parseUploadedDate,
} from "./units";

type RawStats = {
  title: string | null;
  author: string | null;
  pairs: Record<string, string>;
  descriptionRaw: string | null;
};

// IMPORTANT: this function body is serialized to a string and shipped to the
// browser via `page.evaluate`. It must NOT use arrow functions or `const x = () => {}`
// declarations at the top level — tsx/esbuild rewrites those into a form that
// references a `__name` helper that doesn't exist in the browser scope. Plain
// `function` declarations inside the evaluated body are safe.
const COLLECT_RAW_STATS_SOURCE = `() => {
  const title = (document.querySelector("h1") || {}).textContent;
  const titleTrim = title ? title.trim() : null;

  // Author anchor wraps the avatar image — the username lives in the title attr
  // ("Display Name | FT" or just "Display Name"). Strip the "| FT" / "| WK" suffix.
  let author = null;
  const authorAnchor = document.querySelector('a[href*="/wikiloc/user.do"]');
  if (authorAnchor) {
    const titleAttr = (authorAnchor.getAttribute("title") || "").trim();
    const textContent = (authorAnchor.textContent || "").trim();
    const raw = titleAttr || textContent;
    if (raw) {
      const piped = raw.split("|");
      author = piped[0].trim() || raw;
    }
  }

  const pairs = {};
  function nextNonEmptySibling(node) {
    var n = node.nextElementSibling;
    while (n && !((n.textContent || "").trim())) n = n.nextElementSibling;
    return n;
  }

  // Wikiloc uses dt/dd in some templates and div/div in others. We collect both.
  const dtLabels = Array.from(document.querySelectorAll("dt, .stat-label, [class*='label']"));
  for (var i = 0; i < dtLabels.length; i++) {
    const node = dtLabels[i];
    const label = (node.textContent || "").trim();
    if (!label) continue;
    const valueNode = nextNonEmptySibling(node);
    const value = valueNode ? (valueNode.textContent || "").trim() : "";
    if (value && !pairs[label]) pairs[label] = value;
  }

  const knownLabels = [
    "Distance",
    "Elevation gain",
    "Elevation loss",
    "Technical difficulty",
    "Max elevation",
    "Min elevation",
    "TrailRank",
    "Trail type",
    "Moving time",
    "Time",
    "Coordinates",
    "Uploaded",
    "Recorded",
  ];
  const allText = Array.from(document.querySelectorAll("body *"));
  for (var j = 0; j < allText.length; j++) {
    const el = allText[j];
    const text = (el.textContent || "").trim();
    if (!text || text.length > 80) continue;
    if (knownLabels.indexOf(text) === -1) continue;
    if (pairs[text]) continue;
    const valueNode = nextNonEmptySibling(el);
    if (valueNode) {
      const value = (valueNode.textContent || "").trim();
      if (value) pairs[text] = value;
    }
  }

  // <meta name="description"> holds the author's prose for the trail. It's the
  // most reliable source — the DOM markup for the on-page description varies
  // by template and is interleaved with photo carousels.
  let descriptionRaw = null;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    const content = (metaDesc.getAttribute("content") || "").trim();
    if (content.length > 0) descriptionRaw = content;
  }

  return {
    title: titleTrim,
    author: author,
    pairs: pairs,
    descriptionRaw: descriptionRaw,
  };
}`;

const collectRawStats = async (page: Page): Promise<RawStats> => {
  // Pass the function as a string (via Function constructor) so tsx's esbuild
  // pass doesn't rewrite it before serialization to the browser.
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const fn = new Function(`return (${COLLECT_RAW_STATS_SOURCE})`)() as () => RawStats;
  return await page.evaluate(fn);
};

export const parseTrailDetail = async (
  page: Page,
  url: string,
): Promise<TrailDetail> => {
  const raw = await collectRawStats(page);
  const externalId =
    extractWikilocTrailIdFromUrl(url) ?? extractWikilocTrailIdFromUrl(page.url()) ?? "";

  const parsePair = <T>(label: string, fn: (value: string) => T | null): T | null => {
    const value = raw.pairs[label];
    return value ? fn(value) : null;
  };

  // Until the Gemini rewrite runs, every locale falls back to the raw title
  // so the LocalizedString shape is always populated.
  const titleRaw = raw.title ?? "";
  return {
    source: "wikiloc",
    externalId,
    url,
    titleRaw,
    title: { en: titleRaw, ca: titleRaw, es: titleRaw },
    descriptionRaw: raw.descriptionRaw,
    author: raw.author,
    distanceMeters: parsePair("Distance", parseDistance),
    elevationGainMeters: parsePair("Elevation gain", parseElevation),
    elevationLossMeters: parsePair("Elevation loss", parseElevation),
    maxElevationMeters: parsePair("Max elevation", parseElevation),
    minElevationMeters: parsePair("Min elevation", parseElevation),
    technicalDifficulty: parsePair("Technical difficulty", parseTechnicalDifficulty),
    trailType: parsePair("Trail type", parseTrailType),
    movingTimeSeconds: parsePair("Moving time", parseDuration),
    totalTimeSeconds: parsePair("Time", parseDuration),
    coordinatesCount: parsePair("Coordinates", parseInteger),
    uploadedAt: parsePair("Uploaded", parseUploadedDate),
    recordedAt: parsePair("Recorded", parseRecordedMonth),
    coordinates: null,
  };
};
