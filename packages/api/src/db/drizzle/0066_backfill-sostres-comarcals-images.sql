-- Backfill image_url for the new Sostres Comarcals peaks that have a Wikimedia Commons
-- photo. The 29 pre-existing summits already carry their seed images; this only fills
-- the 7 of the 12 freshly-seeded comarcal roofs for which a freely-licensed Commons
-- photo was found.
--
-- Photos uploaded to S3 under 100cims/mountain/profile/<slug>.jpg, served via CloudFront.
-- Shared cache-buster timestamp (1779480000000) follows the seed-data convention.
--
-- The 5 peaks with no usable Commons photo (puig-daiguabona, puigdon,
-- serrat-de-sant-joan, tossal-de-linfern, roca-de-migdia) keep image_url = NULL; the
-- UI falls back to the country-flag avatar for them.
--
-- Commons sources (attribution kept here for the record):
--   puigsou                 -- File:Puigsou.JPG, CC BY-SA 3.0, DavidianSkitzou
--   comaestremer            -- File:Comaestremer.jpg, CC BY-SA 4.0, Jadieldeplanarovira
--   tossal-de-les-torretes  -- File:TOSSAL DE LES TORRETES ... IB-484.jpg, CC BY-SA 4.0, Isidre blanc
--   turo-del-galutxo        -- File:Turó del Galutxo.jpg, CC0, Paudoca
--   puntal-dels-escambrons  -- File:Puntal dels Escambrons80.JPG, CC BY-SA 3.0, Xufanc
--   turo-den-vives          -- File:Turó d'en Vives.jpg, CC BY-SA 4.0, AMP-SCE
--   tibidabo                -- File:Tibidabo, Barcelona (51865256587).jpg, CC0, Lluís Ferrer

UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/puigsou.jpg?date=1779480000000' WHERE slug = 'puigsou';
UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/comaestremer.jpg?date=1779480000000' WHERE slug = 'comaestremer';
UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/tossal-de-les-torretes.jpg?date=1779480000000' WHERE slug = 'tossal-de-les-torretes';
UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/turo-del-galutxo.jpg?date=1779480000000' WHERE slug = 'turo-del-galutxo';
UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/puntal-dels-escambrons.jpg?date=1779480000000' WHERE slug = 'puntal-dels-escambrons';
UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/turo-den-vives.jpg?date=1779480000000' WHERE slug = 'turo-den-vives';
UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/tibidabo.jpg?date=1779480000000' WHERE slug = 'tibidabo';
