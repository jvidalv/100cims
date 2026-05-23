-- Backfill image_url for the Philippine Ultras peaks that have a freely
-- licensed Wikimedia Commons photo. 17 of 29 covered; the remaining 12
-- (sicapoo, mingan-mountains, labo, tagubud, mangabon, busa, hilong-hilong,
-- kioto-mountains, baco, victoria-palawan, cleopatras-needle, mambajao)
-- keep image_url = NULL and fall back to the country-flag avatar in the UI
-- until better photos are sourced.
--
-- Photos uploaded to S3 under 100cims/mountain/profile/<slug>.jpg, served
-- via CloudFront. Shared cache-buster timestamp (1779531322345) follows
-- the seed-data convention.
--
-- Commons sources (attribution kept here for the record):
--   mount-pulag          -- File:Ph mtpulag.jpg, CC BY-SA 3.0, Benedict Kwok
--   mayon                -- File:Mayon Volcano and the Sleeping Lion.jpg, CC BY-SA 4.0, Chrizluminario
--   mount-banahaw        -- File:Mt Banahaw.jpg, CC BY-SA 3.0, P199
--   mount-tapulao        -- File:Mt Tapulao summit.jpg, CC BY-SA 4.0, Firth m
--   mount-isarog         -- File:Mount Isarog Sunrise.jpg, CC BY-SA 4.0, Drinrem
--   mount-bulusan        -- File:Mt-Bulusan.jpg, CC BY-SA 3.0, Michael Mayo
--   mount-apo            -- File:Mount Apo Banner.JPG, CC BY-SA 3.0, Kleomarlo
--   mount-dulang-dulang  -- File:Dulang-dulang peak.JPG, CC BY-SA 3.0, Kleomarlo
--   mount-kalatungan     -- File:Mt. Kalatungan Sunrise.jpg, CC BY-SA 4.0, Theglennpalacio
--   mount-ragang         -- File:Mt. Ragang.jpg, CC BY-SA 4.0, Kenneth Magbanua
--   mount-malindang      -- File:Mount Malindang - Panorama.jpg, CC BY-SA 4.0, Theglennpalacio
--   mount-matutum        -- File:Mount Matutum.jpg, Public domain, Peachyms
--   mount-halcon         -- File:Mount Halcon.jpg, CC BY-SA 3.0, Mil Del
--   mount-mantalingajan  -- File:Mount mantalingahan palawan.jpg, Public domain, Alastair Robinson
--   kanlaon              -- File:Kanlaon Volcano Negros Occidental, Philippines.jpg, Public domain, Paolobon140
--   mount-madja-as       -- File:MT. Madja-as of Antique.jpg, CC BY-SA 4.0, Gibough
--   mount-guiting-guiting -- File:Guiting-guiting 1.jpg, CC BY-SA 4.0, Androkoy

UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/mount-pulag.jpg?date=1779531322345' WHERE slug = 'mount-pulag';
UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/mayon.jpg?date=1779531322345' WHERE slug = 'mayon';
UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/mount-banahaw.jpg?date=1779531322345' WHERE slug = 'mount-banahaw';
UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/mount-tapulao.jpg?date=1779531322345' WHERE slug = 'mount-tapulao';
UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/mount-isarog.jpg?date=1779531322345' WHERE slug = 'mount-isarog';
UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/mount-bulusan.jpg?date=1779531322345' WHERE slug = 'mount-bulusan';
UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/mount-apo.jpg?date=1779531322345' WHERE slug = 'mount-apo';
UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/mount-dulang-dulang.jpg?date=1779531322345' WHERE slug = 'mount-dulang-dulang';
UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/mount-kalatungan.jpg?date=1779531322345' WHERE slug = 'mount-kalatungan';
UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/mount-ragang.jpg?date=1779531322345' WHERE slug = 'mount-ragang';
UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/mount-malindang.jpg?date=1779531322345' WHERE slug = 'mount-malindang';
UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/mount-matutum.jpg?date=1779531322345' WHERE slug = 'mount-matutum';
UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/mount-halcon.jpg?date=1779531322345' WHERE slug = 'mount-halcon';
UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/mount-mantalingajan.jpg?date=1779531322345' WHERE slug = 'mount-mantalingajan';
UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/kanlaon.jpg?date=1779531322345' WHERE slug = 'kanlaon';
UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/mount-madja-as.jpg?date=1779531322345' WHERE slug = 'mount-madja-as';
UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/mount-guiting-guiting.jpg?date=1779531322345' WHERE slug = 'mount-guiting-guiting';
