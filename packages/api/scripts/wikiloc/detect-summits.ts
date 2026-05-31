/**
 * Re-detect which catalogued mountains each trail SUMMITS, using pure
 * geometry: the trail's GPS track must pass within a small radius of the
 * mountain's coordinates. Writes results to `output/_summits.json`.
 *
 * No LLM. Coordinates are the ground truth — if the trail goes within
 * ~200m of a peak's lat/lng, the trail summits it; otherwise it doesn't.
 *
 * Usage:
 *   yarn tsx packages/api/scripts/wikiloc/detect-summits.ts [<slug>]
 */
import { config as loadDotenv } from "dotenv";
import { readdirSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

loadDotenv({ path: resolve(__dirname, "../../.env.local") });

import {
  detectSummitsGeometric,
  type CatalogPeak,
} from "./lib/detect-summits-geometric";
import { loadAllMountains } from "./lib/load-mountains";
import type { TrailDetail } from "./lib/types";

const OUTPUT_DIR = resolve(__dirname, "output");
const SUMMITS_PATH = resolve(OUTPUT_DIR, "_summits.json");

const TRAILS_REGEX = /export const trails: MountainRoute\[\] = ([\s\S]+);\s*$/m;
const readTrails = (path: string): TrailDetail[] => {
  const text = readFileSync(path, "utf8");
  const match = text.match(TRAILS_REGEX);
  if (!match) throw new Error(`Could not find trails array in ${path}`);
  return JSON.parse(match[1]) as TrailDetail[];
};

const unionSlugs = (existing: string[], next: string[]): string[] => {
  // Preserve order: keep existing slugs first, append new ones in arrival
  // order. Stable across re-runs and across the alphabetical file order.
  const seen = new Set(existing);
  const out = [...existing];
  for (const slug of next) {
    if (!seen.has(slug)) {
      seen.add(slug);
      out.push(slug);
    }
  }
  return out;
};

const main = (): void => {
  const onlySlug = process.argv[2];

  const catalog: CatalogPeak[] = loadAllMountains().map((m) => ({
    slug: m.slug,
    latitude: m.latitude,
    longitude: m.longitude,
  }));
  console.log(`[detect] catalog: ${catalog.length} mountains`);

  const files = readdirSync(OUTPUT_DIR)
    .filter((f) => f.endsWith(".ts"))
    .sort()
    .filter((f) => (onlySlug ? f === `${onlySlug}.ts` : true));
  console.log(`[detect] processing ${files.length} mountain file(s)\n`);

  const summits: Record<string, string[]> = {};
  let totalTrails = 0;
  let errored = 0;
  for (const [index, fileName] of files.entries()) {
    const slug = fileName.slice(0, -3);
    let trails: TrailDetail[];
    try {
      trails = readTrails(resolve(OUTPUT_DIR, fileName));
    } catch (error) {
      // Designed to run alongside the live scraper, so partial writes are
      // expected. Skip the file but continue the batch.
      console.error(`[detect] ${fileName} read failed:`, error);
      errored += 1;
      continue;
    }
    for (const trail of trails) {
      const slugs = detectSummitsGeometric(trail, slug, catalog);
      // Same trail can appear under multiple originating mountains when
      // Wikiloc's geo-search returns it for sibling peaks. Union the
      // attributions instead of clobbering — alphabetical file order
      // should not dictate which mountain "owns" a shared route.
      const prior = summits[trail.externalId];
      summits[trail.externalId] = prior ? unionSlugs(prior, slugs) : slugs;
      if (!prior) totalTrails += 1;
    }
    if ((index + 1) % 50 === 0 || index === files.length - 1) {
      console.log(
        `[detect] ${index + 1}/${files.length} mountains · ${totalTrails} trails`,
      );
    }
  }

  // Sort keys for stable diffs.
  const sorted: Record<string, string[]> = {};
  for (const key of Object.keys(summits).sort()) {
    const value = summits[key];
    if (value) sorted[key] = value;
  }
  writeFileSync(SUMMITS_PATH, JSON.stringify(sorted, null, 2) + "\n", "utf8");

  const totalMulti = Object.values(sorted).filter((s) => s.length > 1).length;
  const totalEmpty = Object.values(sorted).filter((s) => s.length === 0).length;
  const multiPct =
    totalTrails > 0 ? ((totalMulti / totalTrails) * 100).toFixed(1) : "0.0";
  console.log(
    `\n[detect] wrote ${totalTrails} trails · ${totalMulti} multi-mountain (${multiPct}%) · ${totalEmpty} no-match · ${errored} file(s) skipped`,
  );
};

main();
