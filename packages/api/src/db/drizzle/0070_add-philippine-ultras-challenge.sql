-- Philippine Ultras: the 29 peaks of the Philippines with topographic
-- prominence >= 1500 m, as catalogued by peaklist.org and mirrored by the
-- Wikipedia "List of Ultras of the Philippines" article.
-- Coordinates resolved from Wikidata's P625 claim per peak (WGS84).
--
-- 8 peaks are marked essential -- the highest of each island represented in
-- the list: Apo (Mindanao), Pulag (Luzon), Halcon (Mindoro), Mantalingajan
-- (Palawan), Kanlaon (Negros), Madja-as (Panay), Guiting-Guiting (Sibuyan),
-- Mambajao (Camiguin). All other 21 peaks are essential = FALSE.

INSERT INTO mountain (slug, name, location, height, latitude, longitude, essential)
VALUES
  -- Luzon
  ('mount-pulag', 'Mount Pulag', 'Cordillera, Luzon', 2928, 16.583572, 120.883592, TRUE),
  ('mayon', 'Mayon', 'Albay, Luzon', 2462, 13.256667, 123.685000, FALSE),
  ('mount-banahaw', 'Mount Banahaw', 'Quezon / Laguna, Luzon', 2170, 14.066667, 121.483333, FALSE),
  ('mount-tapulao', 'Mount Tapulao', 'Zambales, Luzon', 2037, 15.483300, 120.116600, FALSE),
  ('mount-isarog', 'Mount Isarog', 'Camarines Sur, Luzon', 2000, 13.659167, 123.373333, FALSE),
  ('mount-sicapoo', 'Mount Sicapoo', 'Ilocos Norte / Apayao, Luzon', 2361, 18.015000, 120.937500, FALSE),
  ('mingan-mountains', 'Mingan Mountains', 'Aurora, Luzon', 1901, 15.424167, 121.406944, FALSE),
  ('mount-bulusan', 'Mount Bulusan', 'Sorsogon, Luzon', 1565, 12.770000, 124.050000, FALSE),
  ('mount-labo', 'Mount Labo', 'Camarines Norte, Luzon', 1544, 14.013333, 122.787500, FALSE),
  -- Mindanao
  ('mount-apo', 'Mount Apo', 'Cotabato / Davao del Sur, Mindanao', 2956, 6.987500, 125.270833, TRUE),
  ('mount-dulang-dulang', 'Mount Dulang-dulang', 'Bukidnon, Mindanao', 2938, 8.115278, 124.920833, FALSE),
  ('mount-kalatungan', 'Mount Kalatungan', 'Bukidnon, Mindanao', 2824, 7.955000, 124.802500, FALSE),
  ('mount-ragang', 'Mount Ragang', 'Lanao del Sur, Mindanao', 2815, 7.694444, 124.507500, FALSE),
  ('mount-tagubud', 'Mount Tagubud', 'Davao Oriental, Mindanao', 2670, 7.441667, 126.230000, FALSE),
  ('mount-mangabon', 'Mount Mangabon', 'Mindanao', 2510, 8.605278, 125.108611, FALSE),
  ('mount-malindang', 'Mount Malindang', 'Misamis Occidental, Mindanao', 2404, 8.217500, 123.636667, FALSE),
  ('mount-matutum', 'Mount Matutum', 'South Cotabato, Mindanao', 2286, 6.433333, 125.108333, FALSE),
  ('mount-busa', 'Mount Busa', 'Sarangani / South Cotabato, Mindanao', 2030, 6.118611, 124.683333, FALSE),
  ('mount-hilong-hilong', 'Mount Hilong-Hilong', 'Agusan del Norte, Mindanao', 2012, 9.094722, 125.703889, FALSE),
  ('kioto-mountains', 'Kioto Mountains', 'Davao Oriental, Mindanao', 1816, 6.105833, 125.628056, FALSE),
  -- Mindoro
  ('mount-halcon', 'Mount Halcon', 'Oriental Mindoro', 2616, 13.250000, 120.983333, TRUE),
  ('mount-baco', 'Mount Baco', 'Occidental Mindoro', 2364, 12.821111, 121.173056, FALSE),
  -- Palawan
  ('mount-mantalingajan', 'Mount Mantalingajan', 'Palawan', 2085, 8.818333, 117.669722, TRUE),
  ('mount-victoria-palawan', 'Mount Victoria', 'Palawan', 1709, 9.365000, 118.334167, FALSE),
  ('cleopatras-needle', 'Cleopatra''s Needle', 'Palawan', 1608, 10.117058, 118.981803, FALSE),
  -- Single-island roofs
  ('kanlaon', 'Kanlaon', 'Negros Occidental / Negros Oriental, Negros', 2465, 10.411944, 123.131944, TRUE),
  ('mount-madja-as', 'Mount Madja-as', 'Antique, Panay', 2117, 11.389200, 122.162900, TRUE),
  ('mount-guiting-guiting', 'Mount Guiting-Guiting', 'Romblon, Sibuyan', 2050, 12.413889, 122.567778, TRUE),
  ('mount-mambajao', 'Mount Mambajao', 'Camiguin', 1630, 9.171111, 124.724167, TRUE)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO challenge (name, slug, country, emoji)
VALUES ('Philippine Ultras', 'philippine-ultras', 'PHL', '🌋');

INSERT INTO challenge_has_mountain (challenge_id, mountain_id)
SELECT (SELECT id FROM challenge WHERE slug = 'philippine-ultras'), id
FROM mountain
WHERE slug IN (
  -- Luzon
  'mount-pulag', 'mayon', 'mount-banahaw', 'mount-tapulao', 'mount-isarog',
  'mount-sicapoo', 'mingan-mountains', 'mount-bulusan', 'mount-labo',
  -- Mindanao
  'mount-apo', 'mount-dulang-dulang', 'mount-kalatungan', 'mount-ragang',
  'mount-tagubud', 'mount-mangabon', 'mount-malindang', 'mount-matutum',
  'mount-busa', 'mount-hilong-hilong', 'kioto-mountains',
  -- Mindoro
  'mount-halcon', 'mount-baco',
  -- Palawan
  'mount-mantalingajan', 'mount-victoria-palawan', 'cleopatras-needle',
  -- Single-island roofs
  'kanlaon', 'mount-madja-as', 'mount-guiting-guiting', 'mount-mambajao'
);
