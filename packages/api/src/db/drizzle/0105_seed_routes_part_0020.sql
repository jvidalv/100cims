-- Seed routes — original INSERT bodies emptied after rows were applied to
-- production (see packages/api/src/db/drizzle/0105_seed_routes_part_0020.sql).
-- Drizzle's migrator compares the journal's `when` timestamps against the
-- DB's __drizzle_migrations.created_at, so this empty body is never
-- re-executed on environments that have already run the original file. The
-- file must still exist (drizzle reads every entry referenced by
-- _journal.json) and the trail data lives in the route + mountain_route
-- tables. Re-emit via scripts/wikiloc/emit-seed-sql.ts on a fresh DB.
SELECT 1;
