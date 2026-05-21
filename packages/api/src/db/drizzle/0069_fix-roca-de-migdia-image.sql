-- Fix the Roca de Migdia photo: 0068 backfilled a wrong image. A correct one
-- has been uploaded to the same S3 key, so the cache-buster timestamp is
-- bumped (1779482400000 -> 1779484800000) to force CloudFront and clients to
-- re-fetch instead of serving the stale cached image.

UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/roca-de-migdia.jpg?date=1779484800000' WHERE slug = 'roca-de-migdia';
