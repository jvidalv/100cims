-- 1. New product: fleece quarter-zip pullover with two color variants
-- (green, blue). Images already uploaded to S3/CloudFront.
INSERT INTO merch (
  id, slug, name_en, name_ca, name_es,
  description_en, description_ca, description_es,
  shop_url, image_urls, has_size, price, discounted_price,
  featured, active
) VALUES (
  '91eb5014-7861-405e-b96e-b8be682fa6c5',
  'fleece',
  'Fleece',
  'Folre polar',
  'Forro polar',
  'Warm lightweight 1/4-zip fleece for cold alpine starts. Wear it on summit day or around camp — hand-assembled in small batches so every thread carries the project.',
  'Folre polar 1/4 de cremallera, càlid i lleuger, pensat per als matins d''alta muntanya. Fet en sèries curtes i acabat a mà perquè cada puntada porti el projecte al damunt.',
  'Forro polar 1/4 cremallera, cálido y ligero, pensado para los amaneceres en alta montaña. Fabricado en series cortas y terminado a mano: cada puntada lleva el proyecto contigo.',
  NULL,
  ARRAY['https://dg49c3nlr5rbl.cloudfront.net/100cims/merch/91eb5014-7861-405e-b96e-b8be682fa6c5/green/5065f48f-cd0f-4dc3-88ee-891208cf6f9b.jpeg'],
  true,
  100,
  NULL,
  NULL,
  true
);

INSERT INTO merch_variant (merch_id, color, image_urls) VALUES
  (
    '91eb5014-7861-405e-b96e-b8be682fa6c5',
    'green',
    ARRAY['https://dg49c3nlr5rbl.cloudfront.net/100cims/merch/91eb5014-7861-405e-b96e-b8be682fa6c5/green/5065f48f-cd0f-4dc3-88ee-891208cf6f9b.jpeg']
  ),
  (
    '91eb5014-7861-405e-b96e-b8be682fa6c5',
    'blue',
    ARRAY['https://dg49c3nlr5rbl.cloudfront.net/100cims/merch/91eb5014-7861-405e-b96e-b8be682fa6c5/blue/b1cdef01-75b5-405b-81e7-f857b097ee70.jpeg']
  ),
  (
    '91eb5014-7861-405e-b96e-b8be682fa6c5',
    'orange',
    ARRAY['https://dg49c3nlr5rbl.cloudfront.net/100cims/merch/91eb5014-7861-405e-b96e-b8be682fa6c5/orange/3e8a83a8-da25-4912-b7b3-9fd3fc04361a.jpeg']
  );

-- 2. Replace product images with freshly uploaded shots.
UPDATE merch
SET image_urls = ARRAY['https://dg49c3nlr5rbl.cloudfront.net/100cims/merch/ca37ef37-7603-467f-8c59-28a0e3e4438d/6c45f786-4d59-488d-a2ff-ee58490a4a50.jpeg']
WHERE id = 'ca37ef37-7603-467f-8c59-28a0e3e4438d';  -- mug

UPDATE merch
SET image_urls = ARRAY['https://dg49c3nlr5rbl.cloudfront.net/100cims/merch/09046070-a0c9-48cc-8f32-00ad41ae5f6f/ce88d462-cb57-40eb-b4aa-bb5ae2c3b40b.jpeg']
WHERE id = '09046070-a0c9-48cc-8f32-00ad41ae5f6f';  -- cap

UPDATE merch
SET image_urls = ARRAY['https://dg49c3nlr5rbl.cloudfront.net/100cims/merch/068c8262-7328-44d3-8f63-1d1d31fed76d/black/cef3cb0d-f727-42bc-8525-e42a30c968ec.jpeg']
WHERE id = '068c8262-7328-44d3-8f63-1d1d31fed76d';  -- shirt primary (uses black variant shot)

UPDATE merch_variant
SET image_urls = ARRAY['https://dg49c3nlr5rbl.cloudfront.net/100cims/merch/068c8262-7328-44d3-8f63-1d1d31fed76d/white/d1832929-52ac-453d-815a-bcd8713344d0.jpeg']
WHERE merch_id = '068c8262-7328-44d3-8f63-1d1d31fed76d' AND color = 'white';

UPDATE merch_variant
SET image_urls = ARRAY['https://dg49c3nlr5rbl.cloudfront.net/100cims/merch/068c8262-7328-44d3-8f63-1d1d31fed76d/black/cef3cb0d-f727-42bc-8525-e42a30c968ec.jpeg']
WHERE merch_id = '068c8262-7328-44d3-8f63-1d1d31fed76d' AND color = 'black';

-- 3. Raise prices of existing products by 5€ (fleece ships at 100€ already).
UPDATE merch SET price = price + 5 WHERE slug IN ('cap', 'mug', 'shirt');

-- 3b. Retire the buff entirely. merch_variant cascades via FK.
DELETE FROM merch WHERE slug = 'buff';

-- 4. Localized descriptions for the existing collection.
UPDATE merch SET
  description_en = 'Heavyweight combed-cotton tee with an embroidered CIMS mountain crest. Small-batch, printed and finished by hand to go the distance from the trail to town.',
  description_ca = 'Samarreta de cotó pentinat de gramatge alt amb l''emblema CIMS brodat. Feta en sèries curtes i acabada a mà per aguantar del sender al poble.',
  description_es = 'Camiseta de algodón peinado de gramaje alto con el emblema CIMS bordado. Hecha en series cortas y terminada a mano para aguantar del sendero al pueblo.'
WHERE slug = 'shirt';

UPDATE merch SET
  description_en = 'Ceramic mug for the first coffee before the ridge and the one waiting when you come back. Printed in small runs — a quiet companion for long mornings and planning sessions.',
  description_ca = 'Tassa de ceràmica per al primer cafè abans de la carena i el que t''espera en tornar. Impresa en sèries curtes — companya silenciosa de matins llargs i plans pendents.',
  description_es = 'Taza de cerámica para el primer café antes de la cresta y el que te espera al volver. Impresa en series cortas — compañera silenciosa de mañanas largas y planes pendientes.'
WHERE slug = 'mug';

UPDATE merch SET
  description_en = 'Structured six-panel cap with a dense embroidered CIMS crest. Built to block the sun on a ridge and keep its shape through season after season. Small-batch and hand-finished.',
  description_ca = 'Gorra estructurada de sis panells amb l''emblema CIMS brodat ben dens. Pensada per tapar el sol a la carena i mantenir la forma temporada rere temporada. Sèries curtes i acabat a mà.',
  description_es = 'Gorra estructurada de seis paneles con el emblema CIMS bordado denso. Pensada para cortar el sol en la cresta y mantener su forma temporada tras temporada. Series cortas y acabado a mano.'
WHERE slug = 'cap';

