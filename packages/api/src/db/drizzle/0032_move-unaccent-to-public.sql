-- Ensure the unaccent extension resolves from bare queries.
-- The Supabase dump restored unaccent into the `extensions` schema, but app
-- queries call `unaccent(...)` unqualified and only have `public` on their
-- search_path, so `function unaccent(text) does not exist` fires on prod.
-- Creating in public (no-op if already there) covers fresh installs, and
-- the DO block moves the existing one across on Railway.

CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public;
--> statement-breakpoint

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_extension e
    JOIN pg_namespace n ON e.extnamespace = n.oid
    WHERE e.extname = 'unaccent' AND n.nspname <> 'public'
  ) THEN
    EXECUTE 'ALTER EXTENSION unaccent SET SCHEMA public';
  END IF;
END $$;
