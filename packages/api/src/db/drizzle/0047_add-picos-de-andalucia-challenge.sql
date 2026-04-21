-- Picos de Andalucía: the highest peak of each of the 8 Andalusian provinces.
-- A classic regional mountaineering challenge. Mulhacén already exists in the DB
-- (linked to top-spain) — ON CONFLICT preserves it. All 8 marked essential
-- since every peak in a signature-list challenge is core by definition.

INSERT INTO mountain (slug, name, location, height, latitude, longitude, essential)
VALUES
  ('mulhacen',     'Mulhacén',         'Sierra Nevada, Granada',                      3479,    37.053333, -3.311389, TRUE),
  ('chullo',       'Chullo',           'Sierra Nevada, Almería',                      2611,    37.096111, -2.998611, TRUE),
  ('pico-magina',  'Pico Mágina',      'Sierra Mágina, Jaén',                         2167,    37.725000, -3.466670, TRUE),
  ('torrecilla',   'Torrecilla',       'Sierra de las Nieves, Málaga',                1919,    36.675951, -4.996218, TRUE),
  ('el-torreon',   'El Torreón',       'Sierra del Pinar, Cádiz',                     1654,    36.755800, -5.400600, TRUE),
  ('pico-tinosa',  'Pico de la Tiñosa','Sierras Subbéticas, Córdoba',                 1570,    37.384967, -4.240742, TRUE),
  ('el-terril',    'El Terril',        'Sierra del Terril, Sevilla',                  1128,    37.016532, -5.148864, TRUE),
  ('los-bonales',  'Los Bonales',      'Sierra de Aracena, Huelva',                   1064,    37.959722, -6.585278, TRUE)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO challenge (name, slug, country)
VALUES ('Picos de Andalucía', 'picos-de-andalucia', 'ESP');

INSERT INTO challenge_has_mountain (challenge_id, mountain_id)
SELECT
  (SELECT id FROM challenge WHERE slug = 'picos-de-andalucia'),
  id
FROM mountain
WHERE slug IN (
  'mulhacen', 'chullo', 'pico-magina', 'torrecilla',
  'el-torreon', 'pico-tinosa', 'el-terril', 'los-bonales'
);
