-- Replace Tossal dels Tres Reis (1350 m) with Les Mirandes (1359 m) as
-- the Montsià sostre comarcal — Carles López correction. Tres Reis stays
-- in the mountain catalog; only its challenge link is severed.

-- 1. New mountain: Les Mirandes
INSERT INTO mountain (
  slug, name, location, height, latitude, longitude, essential,
  utm31tx, utm31ty, url, image_url
) VALUES (
  'les-mirandes',
  'Les Mirandes',
  'Montsià',
  1359,
  40.74,
  0.17,
  TRUE,
  261050,
  4513900,
  NULL,
  'https://josepvidal-public-dev-bucket.s3.eu-west-3.amazonaws.com/100cims/mountain/profile/les-mirandes.jpg?date=1780000000000'
);

-- 2. Attach Les Mirandes to the Sostres Comarcals challenge
INSERT INTO challenge_has_mountain (challenge_id, mountain_id)
SELECT
  (SELECT id FROM challenge WHERE slug = 'sostres-comarcals'),
  (SELECT id FROM mountain WHERE slug = 'les-mirandes');

-- 3. Detach Tossal dels Tres Reis from the Sostres Comarcals challenge
DELETE FROM challenge_has_mountain
WHERE challenge_id = (SELECT id FROM challenge WHERE slug = 'sostres-comarcals')
  AND mountain_id  = (SELECT id FROM mountain  WHERE slug = 'tossal-dels-tres-reis');
