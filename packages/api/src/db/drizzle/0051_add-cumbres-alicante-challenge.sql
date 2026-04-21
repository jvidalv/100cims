-- Cumbres de Alicante: 11 iconic signature peaks of Alicante province.
-- 5 peaks already exist (from cumbres-del-levante) and are reused via ON CONFLICT.
-- All 11 marked essential — signature-list convention (same as Three Peaks / Andalucía).

INSERT INTO mountain (slug, name, location, height, latitude, longitude, essential)
VALUES
  ('montcabrer',     'Montcabrer',       'Serra de Mariola, Alicante',        1390, 38.758333, -0.488333, TRUE),
  ('serrella',       'Serrella',         'Serra de la Serrella, Alicante',    1379, 38.716700, -0.275000, TRUE),
  ('el-menejador',   'El Menejador',     'Serra de Mariola, Alicante',        1354, 38.761100, -0.476400, TRUE),
  ('maigmo',         'Maigmó',           'Serra del Maigmó, Alicante',        1296, 38.493333, -0.661944, TRUE),
  ('cabeco-dor',     'Cabeçó d''Or',     'Serra del Cabeçó d''Or, Alicante',  1210, 38.521661, -0.387192, TRUE),
  ('penon-de-ifach', 'Peñón de Ifach',   'Marina Alta, Alicante',              332, 38.634722,  0.074444, TRUE)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO challenge (name, slug, country)
VALUES ('Cumbres de Alicante', 'cumbres-alicante', 'ESP');

INSERT INTO challenge_has_mountain (challenge_id, mountain_id)
SELECT
  (SELECT id FROM challenge WHERE slug = 'cumbres-alicante'),
  id
FROM mountain
WHERE slug IN (
  'sierra-de-aitana', 'puig-campana', 'montcabrer', 'serrella',
  'el-menejador', 'maigmo', 'cabeco-dor',
  'cim-del-ponig', 'sierra-de-bernia', 'montgo', 'penon-de-ifach'
);
