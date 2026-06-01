-- Second round of Philippine Ultras image backfills. Brings the covered total
-- from 17 of 29 (after 0071) to 22 of 29.
--
-- Two photos supplied directly by the operator (sicapoo, labo); three
-- additional free-licence Commons photos discovered in a second sweep
-- (mangabon, baco, mambajao). Photos uploaded to S3 under
-- 100cims/mountain/profile/<slug>.jpg, served via CloudFront. Shared
-- cache-buster timestamp (1779533583297) follows the seed-data convention.
--
-- Commons sources for record:
--   mount-mangabon  -- File:Pantaron Range from Bukidnon, Philippines.jpg, CC0, Obsidian Soul
--   mount-baco      -- File:Aguas, Rizal, Occidental Mindoro, Philippines - panoramio (1).jpg, CC BY 3.0, artoval1246
--   mount-mambajao  -- File:Camiguin across Bohol Sea.jpg, CC BY-SA 3.0, P199
--
-- Still imageless (7 of 29): mingan-mountains, mount-tagubud, mount-busa,
-- mount-hilong-hilong, kioto-mountains, mount-victoria-palawan,
-- cleopatras-needle. UI falls back to the country-flag avatar for them.

UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/mount-sicapoo.jpg?date=1779533583297' WHERE slug = 'mount-sicapoo';
UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/mount-labo.jpg?date=1779533583297' WHERE slug = 'mount-labo';
UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/mount-mangabon.jpg?date=1779533583297' WHERE slug = 'mount-mangabon';
UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/mount-baco.jpg?date=1779533583297' WHERE slug = 'mount-baco';
UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/mount-mambajao.jpg?date=1779533583297' WHERE slug = 'mount-mambajao';
