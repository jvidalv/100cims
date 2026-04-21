-- Shorten Picos de Europa location strings — the "— Picos de Europa —" middle
-- segment is redundant when users are already browsing the Picos challenge,
-- and it makes the two-line label wrap awkwardly in the mobile UI.
--
-- "Cantabria — Picos de Europa — Macizo Ándara"  →  "Cantabria — Macizo Ándara"
-- "Asturias/León — Picos de Europa — Macizo Urrieles"  →  "Asturias/León — Macizo Urrieles"

UPDATE mountain
SET location = REPLACE(location, ' — Picos de Europa — ', ' — ')
WHERE location LIKE '% — Picos de Europa — %';
