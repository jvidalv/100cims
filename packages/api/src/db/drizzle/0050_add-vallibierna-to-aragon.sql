-- Add Pico de Vallibierna (3,067 m) to the Aragón challenge.
-- Pyrenean 3000er in the Posets-Maladeta massif, Huesca.
-- Image lead photo from Wikipedia Commons (File:Vallibierna.jpg), uploaded to our S3.

INSERT INTO mountain (slug, name, location, height, latitude, longitude, essential, image_url)
VALUES (
  'vallibierna', 'Pico de Vallibierna', 'Macizo Maladeta, Huesca',
  3067, 42.616700, 0.516700, TRUE,
  'https://josepvidal-public-dev-bucket.s3.eu-west-3.amazonaws.com/100cims/mountain/profile/vallibierna.jpg'
)
ON CONFLICT (slug) DO NOTHING;

-- Ensure image_url is set even if the row already existed (idempotent re-runs).
UPDATE mountain
SET image_url = 'https://josepvidal-public-dev-bucket.s3.eu-west-3.amazonaws.com/100cims/mountain/profile/vallibierna.jpg'
WHERE slug = 'vallibierna' AND image_url IS NULL;

INSERT INTO challenge_has_mountain (challenge_id, mountain_id)
SELECT
  (SELECT id FROM challenge WHERE slug = 'aragon'),
  id
FROM mountain
WHERE slug = 'vallibierna';
