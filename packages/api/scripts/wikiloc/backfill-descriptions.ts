/**
 * One-shot backfill for the `description` LocalizedString field on every
 * already-scraped output file. Reads each file, calls Gemini for trails
 * whose description is still null, writes the file back in place.
 *
 * Run `yarn tsx scripts/wikiloc/rebuild-data.ts` afterwards to refresh the
 * app's data folder (this script does NOT sync per mountain — see in-loop
 * comment).
 *
 * Usage:
 *   yarn tsx scripts/wikiloc/backfill-descriptions.ts
 *   yarn tsx scripts/wikiloc/backfill-descriptions.ts <slug>
 *   yarn tsx scripts/wikiloc/backfill-descriptions.ts --force
 *
 * Designed to run alongside the live `scrape.ts` overnight job — it only
 * touches files in `output/`, and only after they've finished writing.
 */
import { config as loadDotenv } from "dotenv";
import { readdirSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

import { z } from "zod";

loadDotenv({ path: resolve(__dirname, "../../.env.local") });

import { createGeminiTextClient } from "./lib/gemini";
import { loadAllMountains } from "./lib/load-mountains";
import { rewriteDescriptions } from "./lib/rewrite-descriptions";
import type { TrailDetail } from "./lib/types";

const NonEmptyString = z.string().min(1);
const EnvSchema = z.object({
  GEMINI_API_KEY: NonEmptyString,
  GEMINI_MODEL: NonEmptyString.default("gemini-2.5-flash"),
});

const OUTPUT_DIR = resolve(__dirname, "output");

// Each scraper output file is `// comments...\n\nimport ...\n\nexport const trails: MountainRoute[] = [...]`.
// We pull the JSON between `= ` and the trailing `;`, parse it, mutate the
// description field, then re-serialize using the same header style.
// Matches `detect-summits.ts`'s permissive trailing-whitespace handling so
// editor-touched / CRLF files don't silently fail in one tool but not the
// other.
const TRAILS_REGEX =
  /^export const trails: MountainRoute\[\] = ([\s\S]+);\s*$/m;

const readTrailsFromFile = (path: string): TrailDetail[] => {
  const text = readFileSync(path, "utf8");
  const match = text.match(TRAILS_REGEX);
  if (!match) throw new Error(`Could not find trails array in ${path}`);
  return JSON.parse(match[1]) as TrailDetail[];
};

const writeTrailsBackToFile = (path: string, trails: TrailDetail[]): void => {
  const text = readFileSync(path, "utf8");
  const headerEnd = text.indexOf("export const trails");
  if (headerEnd === -1) throw new Error(`Bad file format: ${path}`);
  const header = text.slice(0, headerEnd);
  const body =
    "export const trails: MountainRoute[] = " +
    JSON.stringify(trails, null, 2) +
    ";\n";
  writeFileSync(path, header + body, "utf8");
};

const main = async (): Promise<void> => {
  const env = EnvSchema.parse(process.env);
  const gemini = createGeminiTextClient({
    apiKey: env.GEMINI_API_KEY,
    model: env.GEMINI_MODEL,
  });

  const allMountains = loadAllMountains();
  const slugToName = new Map(allMountains.map((m) => [m.slug, m.name]));

  // Positional args:
  //   --force         re-rewrite even files whose trails already have
  //                   descriptions (useful when the prompt has changed).
  //   <slug>          backfill only that single mountain (skips everything
  //                   else). Useful for prompt iteration.
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const onlySlug = args.find((a) => !a.startsWith("--"));
  const allFiles = readdirSync(OUTPUT_DIR)
    .filter((f) => f.endsWith(".ts"))
    .sort();
  const files = onlySlug
    ? allFiles.filter((f) => f === `${onlySlug}.ts`)
    : allFiles;
  console.log(
    `[backfill] ${files.length}${onlySlug ? "" : "/" + allFiles.length} files to process${onlySlug ? ` (filtered to ${onlySlug})` : ""}\n`,
  );

  let done = 0;
  let skipped = 0;
  let errored = 0;
  for (const [index, fileName] of files.entries()) {
    const slug = fileName.slice(0, -".ts".length);
    const outPath = resolve(OUTPUT_DIR, fileName);
    const mountainName = slugToName.get(slug) ?? slug;
    const prefix = `[${slug}] (${index + 1}/${files.length})`;

    let trails: TrailDetail[];
    try {
      trails = readTrailsFromFile(outPath);
    } catch (error) {
      console.error(`${prefix} read failed:`, error);
      errored += 1;
      continue;
    }

    // Use `!= null` (loose) so both `null` and `undefined` count as missing.
    // Pre-rewrite files didn't have the field at all (=== undefined); newly
    // backfilled files set it to a LocalizedString (=== object). Skip files
    // where every trail already has a description (the trails.length>0
    // guard avoids treating an empty file as "done").
    if (
      !force &&
      trails.length > 0 &&
      trails.every((t) => t.description != null)
    ) {
      console.log(`${prefix} already backfilled, skipping`);
      skipped += 1;
      continue;
    }

    // Only re-rewrite trails that actually need it. Without this filter,
    // a file with 4 good + 1 missing description would re-rewrite all 5
    // and silently overwrite the 4 previously-good entries. `--force`
    // explicitly opts into rewriting the whole file (e.g. after a prompt
    // change).
    const toRewrite = force
      ? trails
      : trails.filter((t) => t.description == null);
    if (toRewrite.length === 0) {
      console.log(`${prefix} nothing to rewrite, skipping`);
      skipped += 1;
      continue;
    }
    console.log(
      `${prefix} rewriting ${toRewrite.length}/${trails.length} description(s)…`,
    );
    try {
      const byId = await rewriteDescriptions({
        client: gemini,
        mountainName,
        trails: toRewrite,
      });
      for (const trail of toRewrite) {
        const localized = byId.get(trail.externalId);
        if (localized) trail.description = localized;
      }
      writeTrailsBackToFile(outPath, trails);
      // syncToApp writes the OLD per-mountain layout to packages/app/.../data
      // and overwrites index.ts; route.api.ts now reads the new layout
      // (ROUTES_BY_ID + MOUNTAIN_TO_ROUTE_IDS) which is produced by
      // rebuild-data.ts. Run `yarn tsx scripts/wikiloc/rebuild-data.ts`
      // after backfill instead of syncing per mountain.
      done += 1;
      console.log(`${prefix} ✓ done`);
    } catch (error) {
      console.error(`${prefix} rewrite failed:`, error);
      errored += 1;
    }
  }

  console.log(
    `\n[backfill] ${done} backfilled · ${skipped} already done · ${errored} error`,
  );
};

void main().catch((error) => {
  console.error("[backfill] unexpected failure:", error);
  process.exit(1);
});
