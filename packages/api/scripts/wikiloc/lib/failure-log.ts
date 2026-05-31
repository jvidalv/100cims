/**
 * Sidecar JSON file that tracks which mountains failed during a scrape run,
 * so a follow-up `--retry-failures` pass can re-run just those slugs.
 *
 * On every per-mountain error we append (or update) the slug's entry. On
 * every per-mountain success we delete the slug from the file — re-runs
 * leave the log clean.
 */
import { existsSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

import { z } from "zod";

const FailureEntrySchema = z.object({
  slug: z.string(),
  lastError: z.string(),
  lastAttemptAt: z.string(), // ISO date
  attempts: z.number().int().nonnegative(),
});

const FailureFileSchema = z.object({
  failures: z.array(FailureEntrySchema),
});

type FailureEntry = z.infer<typeof FailureEntrySchema>;

const failuresPath = (outputDir: string): string =>
  resolve(outputDir, "_failures.json");

const readAll = (outputDir: string): FailureEntry[] => {
  const path = failuresPath(outputDir);
  if (!existsSync(path)) return [];
  const raw = JSON.parse(readFileSync(path, "utf8"));
  const parsed = FailureFileSchema.safeParse(raw);
  if (!parsed.success) {
    console.warn(
      `[failure-log] could not parse ${path}, starting fresh: ${parsed.error.message}`,
    );
    return [];
  }
  return parsed.data.failures;
};

const writeAll = (outputDir: string, entries: FailureEntry[]): void => {
  const path = failuresPath(outputDir);
  const sorted = [...entries].sort((a, b) => a.slug.localeCompare(b.slug));
  writeFileSync(
    path,
    JSON.stringify({ failures: sorted }, null, 2) + "\n",
    "utf8",
  );
};

export const recordFailure = (
  outputDir: string,
  slug: string,
  error: Error,
): void => {
  const all = readAll(outputDir);
  const existing = all.find((e) => e.slug === slug);
  if (existing) {
    existing.lastError = error.message;
    existing.lastAttemptAt = new Date().toISOString();
    existing.attempts += 1;
  } else {
    all.push({
      slug,
      lastError: error.message,
      lastAttemptAt: new Date().toISOString(),
      attempts: 1,
    });
  }
  writeAll(outputDir, all);
};

export const clearFailure = (outputDir: string, slug: string): void => {
  const all = readAll(outputDir);
  const next = all.filter((e) => e.slug !== slug);
  if (next.length !== all.length) writeAll(outputDir, next);
};

export const listFailedSlugs = (outputDir: string): string[] =>
  readAll(outputDir).map((e) => e.slug);
