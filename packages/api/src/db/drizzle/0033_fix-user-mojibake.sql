-- Repair mojibake on user display names: "MartÃ­nez" -> "Martínez".
-- Values were UTF-8 bytes that got decoded as Latin-1 and re-saved as UTF-8
-- somewhere along the historical ingestion path. The reverse conversion
-- restores the original text losslessly. Emails are left alone so we don't
-- break auth lookups.
-- Idempotent: the `~ 'Ã'` guards mean already-clean rows are skipped.

UPDATE "user"
SET first_name = convert_from(convert_to(first_name, 'LATIN1'), 'UTF8')
WHERE first_name ~ 'Ã';
--> statement-breakpoint

UPDATE "user"
SET last_name = convert_from(convert_to(last_name, 'LATIN1'), 'UTF8')
WHERE last_name ~ 'Ã';
