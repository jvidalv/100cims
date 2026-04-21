-- National Three Peaks Challenge: Ben Nevis (Scotland), Yr Wyddfa / Snowdon (Wales), Scafell Pike (England).

-- Insert mountains
INSERT INTO mountain (slug, name, location, height, latitude, longitude, essential, image_url)
VALUES
  ('ben-nevis', 'Ben Nevis', 'Highlands, Scotland', 1345, 56.7969, -5.0036, TRUE,
   'https://josepvidal-public-dev-bucket.s3.eu-west-3.amazonaws.com/100cims/mountain/profile/ben-nevis.jpg'),
  ('yr-wyddfa', 'Yr Wyddfa', 'Eryri (Snowdonia), Wales', 1085, 53.0685, -4.0763, TRUE,
   'https://josepvidal-public-dev-bucket.s3.eu-west-3.amazonaws.com/100cims/mountain/profile/yr-wyddfa.jpg'),
  ('scafell-pike', 'Scafell Pike', 'Lake District, England', 978, 54.4542, -3.2117, TRUE,
   'https://josepvidal-public-dev-bucket.s3.eu-west-3.amazonaws.com/100cims/mountain/profile/scafell-pike.jpg');

-- Insert challenge (id auto-generated via uuid().defaultRandom())
INSERT INTO challenge (name, slug, country)
VALUES ('National Three Peaks Challenge', 'national-three-peaks', 'GBR');

-- Link mountains to challenge
INSERT INTO challenge_has_mountain (challenge_id, mountain_id)
SELECT
  (SELECT id FROM challenge WHERE slug = 'national-three-peaks'),
  id
FROM mountain
WHERE slug IN ('ben-nevis', 'yr-wyddfa', 'scafell-pike');
