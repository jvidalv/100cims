-- Techos Provinciales de España: the highest peak of each of the 50 Spanish
-- provincias plus the 2 autonomous cities (Ceuta and Melilla).
--
-- 52 territories, but 5 pairs of provinces share a summit (Gorbea by Álava
-- and Bizkaia; Torre Cerredo by Asturias and León; Peñalara by Madrid and
-- Segovia; Moncayo by Soria and Zaragoza; Peña Trevinca by Ourense and
-- Zamora), so the challenge gathers 47 distinct peaks.
--
-- 25 of the 47 summits already exist in the catalogue (from the original
-- 100 cims seed, Ehun Mendiak 0061, and Picos de Andalucía 0047); ON CONFLICT
-- preserves them. The 22 below are the provincial roofs not yet in the
-- catalogue. Coordinates resolved from Wikidata's P625 claim per peak (WGS84),
-- with a handful sourced from OpenStreetMap for peaks Wikidata doesn't index.
--
-- 8 peaks marked essential -- one iconic roof per mountain system:
--   Teide (Canarias), Mulhacén (Sierra Nevada), Aneto (Pirineos),
--   Pica d'Estats (Pirineos catalans), Torre Cerredo (Cordillera Cantábrica),
--   Almanzor (Sistema Central), Moncayo (Sistema Ibérico), El Torreón de
--   Grazalema (Béticas occidentales). The 6 already-seeded essentials are
--   already TRUE in the DB; this migration only newly inserts Almanzor and
--   Moncayo as essentials.
--
-- Note: Ciudad Real's roof is "La Bañuela" (1332 m, Sierra Madrona) per
-- modern IGN/CNIG consensus -- the older "Pico de la Estrella / Pico del
-- Amor" name doesn't match any current gazetteer entry.

INSERT INTO mountain (slug, name, location, height, latitude, longitude, essential)
VALUES
  -- Pirineos / Prepirineu (1 new — the others already seeded)
  ('costa-cabirolera', 'Pic de Costa Cabirolera', 'Serra del Cadí, Barcelona', 2604, 42.281459, 1.670418, FALSE),
  -- Cordillera Cantábrica (2)
  ('torre-blanca', 'Torre Blanca', 'Picos de Europa, Cantabria', 2619, 43.172678, -4.851647, FALSE),
  ('pena-prieta-sur', 'Peña Prieta Sur', 'Fuentes Carrionas, Palencia', 2537, 43.021900, -4.730830, FALSE),
  -- Galicia / Macizo Galaico (4)
  ('pena-trevinca', 'Peña Trevinca', 'Serra Segundera, Ourense / Zamora', 2127, 42.242700, -6.796000, FALSE),
  ('o-mustallar', 'O Mustallar', 'Os Ancares, Lugo', 1935, 42.823056, -6.841389, FALSE),
  ('faro-de-avion', 'Faro de Avión', 'Pontevedra', 1181, 42.302460, -8.268286, FALSE),
  ('coto-pilar', 'Coto Pilar', 'Montes do Bocelo, A Coruña', 803, 42.973889, -8.016944, FALSE),
  -- Sistema Central (3 new; Peñalara + Pico del Lobo already seeded)
  ('almanzor', 'Pico Almanzor', 'Sierra de Gredos, Ávila', 2591, 40.246667, -5.297778, TRUE),
  ('canchal-de-la-ceja', 'Canchal de la Ceja', 'Sierra de Béjar, Salamanca', 2428, 40.306100, -5.721390, FALSE),
  ('calvitero', 'El Torreón / Calvitero', 'Sierra de Béjar, Cáceres', 2399, 40.292200, -5.740830, FALSE),
  -- Sistema Ibérico (6 new; Penyagolosa already seeded)
  ('moncayo', 'Moncayo', 'Sistema Ibérico, Soria / Zaragoza', 2314, 41.788056, -1.838333, TRUE),
  ('san-lorenzo', 'San Lorenzo', 'Sierra de la Demanda, La Rioja', 2271, 42.242582, -2.972608, FALSE),
  ('san-millan', 'San Millán', 'Sierra de la Demanda, Burgos', 2131, 42.231567, -3.206328, FALSE),
  ('penarroya', 'Peñarroya', 'Sierra de Gúdar, Teruel', 2028, 40.390089, -0.665156, FALSE),
  ('mogorrita', 'Cerro Mogorrita', 'Serranía de Cuenca', 1864, 40.345865, -1.770169, FALSE),
  ('alto-de-las-barracas', 'Alto de las Barracas', 'Rincón de Ademuz, Valencia', 1838, 40.077778, -1.092500, FALSE),
  -- Montes de Toledo / Sierra Morena / interior (4 new)
  ('corocho-de-rocigalgo', 'Corocho de Rocigalgo', 'Montes de Toledo', 1449, 39.483333, -4.716667, FALSE),
  ('la-banuela', 'La Bañuela', 'Sierra Madrona, Ciudad Real', 1332, 38.420650, -4.235914, FALSE),
  ('tentudia', 'Tentudía', 'Sierra Morena, Badajoz', 1112, 38.054403, -6.338307, FALSE),
  ('cuchillejo', 'Cerro Cuchillejo', 'Páramos del Cerrato, Valladolid', 932, 41.548780, -3.996050, FALSE),
  -- Andalucía / Béticas (1 new; the rest already seeded by Picos de Andalucía)
  ('la-maroma', 'La Maroma', 'Sierra de Tejeda, Málaga', 2066, 36.903889, -4.044167, FALSE),
  -- Sureste & Levante (2 new; Aitana + Caro already seeded)
  ('los-obispos', 'Pico de los Obispos', 'Macizo de Revolcadores, Murcia', 2014, 38.063431, -2.265209, FALSE),
  ('las-atalayas', 'Pico de la Atalaya', 'Sierra de las Cabras, Albacete', 2083, 38.063970, -2.392440, FALSE),
  -- Islas (1 new; Teide + Pico de las Nieves already seeded)
  ('puig-major', 'Puig Major', 'Serra de Tramuntana, Mallorca', 1436, 39.807500, 2.793333, FALSE),
  -- Ciudades autónomas
  ('monte-anyera', 'Monte Anyera', 'Sierra Bullones, Ceuta', 349, 35.897222, -5.373333, FALSE),
  ('rostrogordo', 'Fuerte de Rostrogordo', 'Melilla', 135, 35.314482, -2.957639, FALSE)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO challenge (name, slug, country, emoji)
VALUES ('Techos Provinciales', 'techos-provinciales', 'ESP', '🏔️');

INSERT INTO challenge_has_mountain (challenge_id, mountain_id)
SELECT (SELECT id FROM challenge WHERE slug = 'techos-provinciales'), id
FROM mountain
WHERE slug IN (
  -- Pirineos
  'aneto', 'pica-destats', 'puigpedros', 'hiru-erregeen-mahaia',
  'costa-cabirolera',
  -- Cordillera Cantábrica & País Vasco
  'torrecerredo', 'torre-blanca', 'pena-prieta-sur',
  'gorbeia', 'aketegi',
  -- Galicia
  'pena-trevinca', 'o-mustallar', 'faro-de-avion', 'coto-pilar',
  -- Sistema Central
  'almanzor', 'penalara', 'canchal-de-la-ceja', 'calvitero', 'pico-del-lobo',
  -- Sistema Ibérico
  'moncayo', 'san-lorenzo', 'san-millan', 'penarroya', 'mogorrita',
  'alto-de-las-barracas', 'penyagolosa',
  -- Montes de Toledo / Sierra Morena / interior
  'corocho-de-rocigalgo', 'la-banuela', 'el-terril', 'tentudia',
  'los-bonales', 'cuchillejo',
  -- Andalucía / Béticas
  'mulhacen', 'chullo', 'pico-magina', 'la-maroma', 'pico-tinosa', 'el-torreon',
  -- Sureste & Levante
  'sierra-de-aitana', 'los-obispos', 'las-atalayas', 'caro',
  -- Islas
  'teide', 'pico-de-las-nieves', 'puig-major',
  -- Ciudades autónomas
  'monte-anyera', 'rostrogordo'
);
