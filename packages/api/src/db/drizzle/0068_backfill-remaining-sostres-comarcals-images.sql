-- Backfill image_url for the last 5 Sostres Comarcals peaks. 0066 left these
-- NULL because no freely-licensed Wikimedia Commons photo was found at the
-- time; photos have since been supplied by hand. With this every one of the
-- 12 freshly-seeded comarcal roofs has an image.
--
-- Photos uploaded to S3 under 100cims/mountain/profile/<slug>.jpg, served via
-- CloudFront. Shared cache-buster timestamp (1779482400000) follows the
-- seed-data convention.

UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/puig-daiguabona.jpg?date=1779482400000' WHERE slug = 'puig-daiguabona';
UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/puigdon.jpg?date=1779482400000' WHERE slug = 'puigdon';
UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/serrat-de-sant-joan.jpg?date=1779482400000' WHERE slug = 'serrat-de-sant-joan';
UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/tossal-de-linfern.jpg?date=1779482400000' WHERE slug = 'tossal-de-linfern';
UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/roca-de-migdia.jpg?date=1779482400000' WHERE slug = 'roca-de-migdia';
