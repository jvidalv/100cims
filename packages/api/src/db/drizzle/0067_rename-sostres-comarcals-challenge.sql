-- Rename the challenge from "Sostres Comarcals de Catalunya" to "Sostres Comarcals".
-- The slug (sostres-comarcals) is unchanged; only the display name shrinks.
-- 0065 already seeded the row with the long name, so this is a follow-up data
-- migration rather than an edit to the (immutable, already-applied) 0065 file.

UPDATE challenge
SET name = 'Sostres Comarcals'
WHERE slug = 'sostres-comarcals';
