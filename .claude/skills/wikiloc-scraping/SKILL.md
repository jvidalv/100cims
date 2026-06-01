---
name: wikiloc-scraping
description: Use when adding a new challenge's routes to the catalogue, or anything else involving packages/api/scripts/wikiloc/. Covers the scrape → detect-summits → emit-seed-sql → migrate pipeline, plus the gotchas that bit us during the 9-challenge + ehun-mendiak batches.
---

# Wikiloc scraping playbook

The scraper turns Wikiloc trail pages into seed SQL that ships in a migration.
The pipeline has three discrete scripts you run in order — skipping or
reordering breaks things in subtle, silent ways that the schema validator
won't catch.

## The pipeline (do all three, in order)

```bash
# 1. Scrape Wikiloc for one or many mountains. Resume-safe.
yarn tsx packages/api/scripts/wikiloc/scrape.ts <selector>

# 2. Rebuild the global summit index from every output/*.ts file.
yarn tsx packages/api/scripts/wikiloc/detect-summits.ts

# 3. Emit append-only seed SQL chunks for routes not yet in any migration.
yarn tsx packages/api/scripts/wikiloc/emit-seed-sql.ts

# 4. Apply locally (ask the user first per CLAUDE.md no-fly rules).
yarn api db:migrate
```

`tsx` is NOT in package.json — invoke via `bunx tsx` if it isn't on PATH.

### Selector forms

- A mountain slug: `pica-destats`
- `location:<substring>` — case-insensitive match against the seed's `location`
- `challenge:<slug>` — every mountain in a challenge (see "Adding a challenge" below)
- `all` — every mountain in the seed (multi-hour run)
- `--retry-failures` — re-run only mountains whose previous attempt failed

Flags: `--force` re-scrapes a mountain whose output file already exists.

## The most expensive mistake — skipping `detect-summits.ts`

The scrape writes per-mountain summit-detection into each `output/<slug>.ts`
file's `mountainSlugs` array, but the **global** summit index lives at
`output/_summits.json` and is what `emit-seed-sql.ts` reads. After a fresh
scrape, `_summits.json` doesn't know about the new trails — so emit reports
"0 new routes" and you assume everything's already in the DB.

**Always run `detect-summits.ts` between scrape and emit.** The script does
not regenerate it incrementally; it rebuilds the whole index from every
`output/*.ts` file on disk.

## Adding a new challenge

1. Read the migration that defines the challenge:
   `packages/api/src/db/drizzle/00XX_add-<slug>-challenge.sql`. Extract the
   set of mountain slugs from the INSERT block.
2. Wire it into `packages/api/scripts/wikiloc/lib/load-mountains.ts`:
   - Declare `const <SLUG>_SLUGS = new Set<string>([...])`
   - Add it to the dispatch Record inside `loadMountainsForChallenge`
3. Verify each slug exists in the seed (mountains can be added later in a
   migration — they're scraped by `loadAllMountains()` which scans every
   `INSERT INTO mountain` block across drizzle/*.sql). If any are missing,
   the scrape silently skips them.
4. Run the pipeline as above with `challenge:<slug>`.

## The append-only contract — never violate it

`emit-seed-sql.ts` parses every `seed_routes_part_*.sql` file in
`packages/api/src/db/drizzle/` to find externalIds already on disk, then
filters them out. New chunks get appended after the highest existing
`part_NNNN` number and continue from there.

- **Never edit a shipped seed_routes_part_*.sql file.** Drizzle records its
  hash in `_journal.json`; an in-place edit means existing prod DBs will
  detect a hash mismatch and refuse to deploy. If a fact about a route
  changes, write a custom migration (`yarn api db:generate --custom --name
  fix-X`) that does an UPDATE.
- **Never rename or delete part files** that exist in `_journal.json`. Same
  reason.
- **Never run `drizzle-kit push`.** It silently desynchronises the journal
  from disk and makes the next `db:migrate` fail on Railway with a
  schema-drift error. (See the `0108_add-user-saved-route.sql` post-mortem
  — it had to be rewritten as idempotent because the dev DB diverged.)

`emit-seed-sql.ts` filters by route `externalId` only. It does NOT track
join-table (`mountain_route`) pairs separately — once a route's
externalId is in any seed file, the emitter won't re-emit it, even if a
later run produces a new `mountainSlugs` association for it. If you tighten
the geometric summit detector or add a new mountain that an old trail
passes near, you have to write a custom migration to add the join row by
hand.

## Source-of-truth lifecycle (and what's gitignored)

| File | Source of truth? | In git? |
| ---- | ---------------- | ------- |
| `output/<slug>.ts` | Yes initially | Only if it has trails not yet in any seed SQL |
| `seed_routes_part_NNNN.sql` | **Yes — canonical** | Yes |
| `output/_summits.json` | No — derived from .ts files | No (gitignored) |
| `output/_chain.log`, `_failures.json`, `_backfill.log` | No — local-run state | No (gitignored) |

After a successful pipeline run we delete `output/*.ts` files whose every
trail externalId is in some seed_routes_part_*.sql — the SQL has the same
data and ships in the migration. Partial files (gemini-rejected trails
mixed with kept ones) stay so a future re-emit could in principle pick up
the rejected ones if we ever change the rejection policy.

Concretely: of 859 .ts files after the ehun-mendiak run, 747 were fully
covered → deleted; 112 had at least one trail not in any seed SQL → kept.

## Performance tuning (per `scrape.ts` + `scrape-mountain.ts` + `rate-limit-guard.ts`)

Current tuning (post-ehun-mendiak):

| Knob | Value | File |
| ---- | ----- | ---- |
| Delay between mountains | `jitteredDelay(2_000, 2_000)` (2–4s) | `scrape.ts` |
| Delay between trail-detail fetches | `jitteredDelay(1_000, 1_000)` (1–2s) | `lib/scrape-mountain.ts` |
| Rate-limit cooldown | `5 * 60_000` (5 min) | `lib/rate-limit-guard.ts` |
| Cooldown attempts before abort | `3` | `lib/rate-limit-guard.ts` |

In benchmarks: ~50s/mountain incl. delays. ~2.5h for 178 mountains, zero
rate-limit triggers. If a chain starts 403'ing, the guard sleeps 5 min and
resumes; after 3 cooldowns it aborts the run.

If Wikiloc tightens its WAF:
- Raise `COOLDOWN_MS` and the inter-mountain delay first
- The cooldown total grace before give-up is `COOLDOWN_MS × 3`. Before the
  tightening it was 45 min (15 × 3); now 15 min.

## Gemini integration

`scrape-mountain.ts` calls Gemini twice per mountain:
1. **Validation pass** — given the search results' titles, ask which trails
   actually summit the target mountain. Off-target trails are rejected
   here (you'll see `[<slug>] rejected <id>: not in Gemini keep-list`).
2. **Rewrite pass** — given each kept trail's raw title + description,
   produce a clean English + Catalan version for the app.

`GEMINI_API_KEY` and `GEMINI_MODEL` come from `packages/api/.env.local`.
The default model is `gemini-2.5-flash`. Cost per mountain is small but
non-zero — a full 100-mountain run is in the cents.

## When a scrape fails mid-batch

`scripts/wikiloc/output/_failures.json` accumulates per-slug failure
metadata. Resume with:

```bash
yarn tsx packages/api/scripts/wikiloc/scrape.ts --retry-failures
```

This re-scrapes only the mountains in `_failures.json`, in their original
selection order. Successes clear themselves from the file.

The other resume mode is implicit: if `output/<slug>.ts` exists, the
scraper skips it. To force re-scrape, delete the file (or pass `--force`).

## After running the pipeline

- Lint + type-check both packages (see CLAUDE.md "Always-required
  guardrails")
- The mobile app has no client work to do — `useRouteById` / mountain
  routes list pick up new rows automatically once the migration is in
- Production runs the migration automatically on Railway deploy (per
  CLAUDE.md). Don't tell the user to apply it manually after a push
