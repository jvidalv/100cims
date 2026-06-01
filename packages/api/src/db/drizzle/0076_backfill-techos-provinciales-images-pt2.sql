-- Fill the last 3 Techos Provinciales peaks left imageless by 0074:
-- coto-pilar (A Coruña), la-banuela (Ciudad Real), las-atalayas (Albacete).
-- Photos supplied directly by the operator and uploaded to S3 under
-- 100cims/mountain/profile/<slug>.jpg. Shared cache-buster timestamp
-- (1779556641440) follows the seed-data convention.
--
-- With this all 47 Techos Provinciales peaks have a photo.

UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/coto-pilar.jpg?date=1779556641440' WHERE slug = 'coto-pilar';
UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/la-banuela.jpg?date=1779556641440' WHERE slug = 'la-banuela';
UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/las-atalayas.jpg?date=1779556641440' WHERE slug = 'las-atalayas';
