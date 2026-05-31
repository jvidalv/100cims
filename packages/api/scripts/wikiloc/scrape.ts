/**
 * Wikiloc scraper. Reads mountains from the seed SQL and runs each through
 * the search → detail → Gemini-validate → Gemini-rewrite → write-file pipeline.
 *
 * Usage:
 *   yarn tsx packages/api/scripts/wikiloc/scrape.ts <SELECTOR>
 *
 * SELECTOR is one of:
 *   - A mountain slug:   `pica-destats`
 *   - A `location:`-prefixed substring (case-insensitive match against the
 *     seed's `location` column):  `location:Terra Alta`
 *   - `all` to scrape every mountain in the seed.
 *
 * Behaviour:
 * - Sequential. Output is written to scripts/wikiloc/output/<slug>.ts as
 *   soon as each mountain succeeds, so partial runs are useful.
 * - Resume-safe: any mountain whose output file already exists is skipped.
 *   Delete that file (or pass `--force`) to re-scrape.
 * - Zero-result mountains are logged and skipped — the app's empty-state
 *   row already directs users to Wikiloc for those.
 * - A single mountain's error logs the failure and continues to the next
 *   mountain. This is important for 500+ runs: don't let one flaky page kill
 *   the whole batch.
 */
import { config as loadDotenv } from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";

import { z } from "zod";

loadDotenv({ path: resolve(__dirname, "../../.env.local") });

import {
  clearFailure,
  listFailedSlugs,
  recordFailure,
} from "./lib/failure-log";
import { closeBrowser, jitteredDelay, openBrowser } from "./lib/fetch-page";
import { createGeminiTextClient } from "./lib/gemini";
import {
  loadAllMountains,
  loadMountainsByLocation,
  loadMountainsForChallenge,
  toTarget,
} from "./lib/load-mountains";
import { noticeMountainOutcome } from "./lib/rate-limit-guard";
import { scrapeMountain, type Target } from "./lib/scrape-mountain";

const NonEmptyString = z.string().min(1);
const EnvSchema = z.object({
  GEMINI_API_KEY: NonEmptyString,
  GEMINI_MODEL: NonEmptyString.default("gemini-2.5-flash"),
});

type SummaryRow = { slug: string; status: string; note?: string };

const parseArgs = (): {
  selector: string | null;
  force: boolean;
  retryFailures: boolean;
} => {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const retryFailures = args.includes("--retry-failures");
  const selector = args.find((a) => !a.startsWith("--")) ?? null;
  if (!selector && !retryFailures) {
    console.error(
      "Usage: scrape.ts <slug | location:<substring> | challenge:<slug> | all> [--force]",
    );
    console.error("       scrape.ts --retry-failures");
    process.exit(1);
  }
  return { selector, force, retryFailures };
};

const resolveTargets = (
  selector: string | null,
  retryFailures: boolean,
  outputDir: string,
): Target[] => {
  if (retryFailures) {
    const failed = new Set(listFailedSlugs(outputDir));
    if (failed.size === 0) {
      console.log("[scrape] no failures to retry.");
      return [];
    }
    return sortByHeightDesc(
      loadAllMountains().filter((m) => failed.has(m.slug)),
    ).map(toTarget);
  }
  if (selector === "all") {
    return sortByHeightDesc(loadAllMountains()).map(toTarget);
  }
  if (selector!.startsWith("location:")) {
    const needle = selector!.slice("location:".length);
    return sortByHeightDesc(loadMountainsByLocation(needle)).map(toTarget);
  }
  if (selector!.startsWith("challenge:")) {
    const challenge = selector!.slice("challenge:".length);
    return sortByHeightDesc(loadMountainsForChallenge(challenge)).map(toTarget);
  }
  // Single slug.
  const m = loadAllMountains().find((row) => row.slug === selector);
  if (!m) {
    console.error(`No mountain with slug "${selector}" in seed`);
    process.exit(1);
  }
  return [toTarget(m)];
};

const sortByHeightDesc = <T extends { height: number }>(rows: T[]): T[] =>
  [...rows].sort((a, b) => b.height - a.height);

const main = async (): Promise<void> => {
  const { selector, force, retryFailures } = parseArgs();
  const env = EnvSchema.parse(process.env);
  const outputDir = resolve(__dirname, "output");
  const targets = resolveTargets(selector, retryFailures, outputDir);

  console.log(
    `[scrape] ${retryFailures ? "--retry-failures" : `selector=${selector}`} → ${targets.length} mountain(s); output -> ${outputDir}${force ? " (force)" : ""}\n`,
  );

  const session = await openBrowser();
  const summary: SummaryRow[] = [];
  try {
    const gemini = createGeminiTextClient({
      apiKey: env.GEMINI_API_KEY,
      model: env.GEMINI_MODEL,
    });

    for (const [index, target] of targets.entries()) {
      console.log(`\n=== (${index + 1}/${targets.length}) ${target.slug} ===`);
      const outPath = resolve(outputDir, `${target.slug}.ts`);
      if (!force && existsSync(outPath)) {
        console.log(`[scrape] already exists, skipping: ${outPath}`);
        summary.push({ slug: target.slug, status: "skipped" });
        continue;
      }

      const result = await scrapeMountain({
        session,
        gemini,
        target,
        outputDir,
        logPrefix: target.slug,
      });
      let errorForGuard: Error | null = null;
      if (result.status === "ok") {
        summary.push({
          slug: target.slug,
          status: "ok",
          note: `${result.trails.length} trails`,
        });
        // Clear any prior failure marker now that this mountain succeeded.
        clearFailure(outputDir, target.slug);
      } else if (result.status === "no-results") {
        summary.push({ slug: target.slug, status: "no results" });
        // No-results is a legitimate outcome, not a failure.
        clearFailure(outputDir, target.slug);
      } else {
        // Soft-fail per mountain: log and continue. Hard-aborting on every
        // network blip wastes the run; the summary will surface what failed.
        console.error(`[scrape] ${target.slug} failed: ${result.error.message}`);
        // Persist the failure so `--retry-failures` picks it up next run.
        recordFailure(outputDir, target.slug, result.error);
        summary.push({
          slug: target.slug,
          status: "ERROR",
          note: result.error.message.slice(0, 120),
        });
        errorForGuard = result.error;
      }

      // Rate-limit guard: if Wikiloc starts 403'ing in clusters, sleep for
      // 15 min and resume. After 3 cooldowns it gives up.
      const decision = await noticeMountainOutcome(errorForGuard);
      if (decision === "abort") {
        console.error("[scrape] guard aborting run");
        break;
      }

      // 5–10s breath between mountains so Wikiloc doesn't see a
      // perfectly-spaced request train.
      if (index < targets.length - 1) {
        await jitteredDelay(5_000, 5_000);
      }
    }
  } finally {
    await closeBrowser(session);
  }

  console.log("\n=== SUMMARY ===");
  for (const row of summary) {
    console.log(
      `${row.status.padEnd(11)}  ${row.slug}${row.note ? `  (${row.note})` : ""}`,
    );
  }
  const ok = summary.filter((r) => r.status === "ok").length;
  const skipped = summary.filter((r) => r.status === "skipped").length;
  const empty = summary.filter((r) => r.status === "no results").length;
  const errors = summary.filter((r) => r.status === "ERROR").length;
  console.log(
    `\n${ok} ok · ${skipped} skipped · ${empty} empty · ${errors} error · ${targets.length - summary.length} not reached`,
  );
};

void main().catch((error) => {
  console.error("[scrape] unexpected failure:", error);
  process.exit(1);
});
