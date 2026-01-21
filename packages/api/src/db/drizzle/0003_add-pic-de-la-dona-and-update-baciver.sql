-- Add Pic de la Dona to 100 Cims challenge
INSERT INTO mountain (slug, name, location, height, latitude, longitude, essential, utm31tx, utm31ty, url, image_url)
VALUES (
  'pic-de-la-dona',
  'Pic de la Dona',
  'Ripollès',
  2702,
  42.4375,
  2.2611,
  FALSE,
  443000,
  4699000,
  NULL,
  'https://josepvidal-public-dev-bucket.s3.eu-west-3.amazonaws.com/100cims/mountain/profile/pic-de-la-dona.jpg'
);

-- Associate Pic de la Dona with 100 Cims challenge
INSERT INTO challenge_has_mountain (challenge_id, mountain_id)
SELECT
  '5f996363-7460-4bc8-817c-8dd633c0b504',
  id
FROM mountain
WHERE slug = 'pic-de-la-dona';

-- Make Tuc de Bacivèr essential
UPDATE mountain
SET essential = TRUE
WHERE slug = 'tuc-de-baciver';
