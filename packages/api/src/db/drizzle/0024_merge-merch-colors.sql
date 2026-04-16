-- Merge the two T-shirt products into a single "shirt" product with
-- black + white color variants. Photos from both originals become variant
-- images. Also rename single-color products to drop the "black-" prefix.

-- 1) Seed variants on the row we keep (black-shirt). Cross-join pulls the
--    white images from the other row.
INSERT INTO "merch_variant" ("merch_id", "color", "image_urls")
SELECT b.id, 'white', w.image_urls
  FROM "merch" b, "merch" w
 WHERE b.slug = 'black-shirt'
   AND w.slug = 'white-shirt'
ON CONFLICT DO NOTHING;

INSERT INTO "merch_variant" ("merch_id", "color", "image_urls")
SELECT id, 'black', image_urls
  FROM "merch"
 WHERE slug = 'black-shirt'
ON CONFLICT DO NOTHING;

-- 2) Delete the duplicate white-shirt row (its images live in the variant).
DELETE FROM "merch" WHERE slug = 'white-shirt';

-- 3) Rename black-shirt → shirt, drop the color from the name.
UPDATE "merch"
   SET slug = 'shirt',
       name_en = 'T-shirt',
       name_ca = 'Samarreta',
       name_es = 'Camiseta'
 WHERE slug = 'black-shirt';

-- 4) Rename single-color products so the slug doesn't lie.
UPDATE "merch"
   SET slug = 'mug',
       name_en = 'Mug',
       name_ca = 'Tassa',
       name_es = 'Taza'
 WHERE slug = 'black-mug';

UPDATE "merch"
   SET slug = 'cap',
       name_en = 'Cap',
       name_ca = 'Gorra',
       name_es = 'Gorra'
 WHERE slug = 'black-cap';

UPDATE "merch"
   SET slug = 'buff',
       name_en = 'Buff',
       name_ca = 'Buff',
       name_es = 'Buff'
 WHERE slug = 'black-buff';