-- Promote the Highland (Terra Alta) challenge from user-created to official.
-- Nulls out creator_id (the "official" signal) and renames the auto-suffixed
-- slug to a clean, human-readable one used by the /challenges/[slug] page.
UPDATE challenge
SET creator_id = NULL,
    slug = 'highland-terra-alta'
WHERE id = '019be1fe-492f-761d-b78b-dd00b5fb9805';
