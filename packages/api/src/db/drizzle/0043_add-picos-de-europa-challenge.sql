-- Picos de Europa: 71 peaks at 2,400 m or above, from Wikipedia's IGN-sourced list.
-- Reuses 6 existing rows (torrecerredo, torre-bermeja, naranjo-de-bulnes, morra-lechugales
-- and two more) that were already in cumbres-astures. ON CONFLICT preserves them.

INSERT INTO mountain (slug, name, location, height, latitude, longitude, essential)
VALUES
  ('torrecerredo', 'Torrecerredo', 'Asturias/León — Picos de Europa — Macizo Urrieles', 2650, 43.198056, -4.851111, TRUE),
  ('torre-del-llambrion', 'Torre del Llambrión', 'León — Picos de Europa — Macizo Urrieles', 2642, 43.173300, -4.857220, TRUE),
  ('torre-del-tiro-tirso', 'Torre del Tiro Tirso', 'León — Picos de Europa — Macizo Urrieles', 2641, 43.172500, -4.854170, TRUE),
  ('torre-sin-nombre', 'Torre Sin Nombre', 'León — Picos de Europa — Macizo Urrieles', 2638, 43.172746, -4.852866, TRUE),
  ('torre-casiano-de-prado', 'Torre Casiano de Prado', 'León — Picos de Europa — Macizo Urrieles', 2622, 43.170977, -4.858874, TRUE),
  ('pena-vieja', 'Peña Vieja', 'Cantabria — Picos de Europa — Macizo Urrieles', 2617, 43.174700, -4.808330, TRUE),
  ('torre-bermeja', 'Torre Bermeja', 'Asturias/León — Picos de Europa — Macizo Urrieles', 2606, 43.172910, -5.021174, TRUE),
  ('torre-del-hoyo-grande', 'Torre del Hoyo Grande', 'Asturias — Picos de Europa — Macizo Urrieles', 2602, 43.176600, -4.856133, TRUE),
  ('torre-del-tiro-navarro-i', 'Torre del Tiro Navarro I', 'Asturias/Cantabria — Picos de Europa — Macizo Urrieles', 2602, 43.183933, -4.816908, TRUE),
  ('pico-de-santa-ana-i', 'Pico de Santa Ana I', 'Asturias/Cantabria — Picos de Europa — Macizo Urrieles', 2601, 43.179497, -4.820717, TRUE),
  ('pico-de-santa-ana-ii', 'Pico de Santa Ana II', 'Asturias/Cantabria — Picos de Europa — Macizo Urrieles', 2596, 43.179153, -4.819206, TRUE),
  ('torre-del-tiro-navarro-ii', 'Torre del Tiro Navarro II', 'Asturias/Cantabria — Picos de Europa — Macizo Urrieles', 2596, 43.183314, -4.816589, TRUE),
  ('torre-santa', 'Torre Santa', 'León — Picos de Europa — Macizo Cornión', 2596, 43.203174, -4.968925, TRUE),
  ('torre-de-las-minas-del-carbon', 'Torre de las Minas del Carbón', 'León — Picos de Europa — Macizo Urrieles', 2595, 43.173300, -4.857220, TRUE),
  ('torre-de-coello', 'Torre de Coello', 'Asturias/León — Picos de Europa — Macizo Urrieles', 2584, 43.198056, -4.851111, TRUE),
  ('torre-del-tiro-del-oso', 'Torre del Tiro del Oso', 'Asturias/León — Picos de Europa — Macizo Urrieles', 2576, 43.193386, -4.845475, TRUE),
  ('los-campanarios-ii', 'Los Campanarios II', 'Asturias — Picos de Europa — Macizo Urrieles', 2572, 43.200000, -4.816669, TRUE),
  ('los-campanarios-i', 'Los Campanarios I', 'Asturias — Picos de Europa — Macizo Urrieles', 2569, 43.200000, -4.816669, TRUE),
  ('los-campanarios-iii', 'Los Campanarios III', 'Asturias — Picos de Europa — Macizo Urrieles', 2568, 43.200000, -4.816669, TRUE),
  ('torre-del-tiro-llago', 'Torre del Tiro Llago', 'Cantabria/León — Picos de Europa — Macizo Urrieles', 2567, 43.170472, -4.846706, TRUE),
  ('risco-saint-saud', 'Risco Saint Saud', 'Asturias — Picos de Europa — Macizo Urrieles', 2560, 43.198056, -4.851111, TRUE),
  ('neveron-de-urriellu', 'Neverón de Urriellu', 'Asturias — Picos de Europa — Macizo Urrieles', 2559, 43.204217, -4.833500, TRUE),
  ('la-morra', 'La Morra', 'Asturias — Picos de Europa — Macizo Urrieles', 2554, 43.200000, -4.816669, TRUE),
  ('pico-de-los-cabrones', 'Pico de los Cabrones', 'Asturias — Picos de Europa — Macizo Urrieles', 2552, 43.199540, -4.859188, FALSE),
  ('los-campanarios-iv', 'Los Campanarios IV', 'Asturias — Picos de Europa — Macizo Urrieles', 2543, 43.200000, -4.816669, FALSE),
  ('torre-de-labrouche', 'Torre de Labrouche', 'Asturias — Picos de Europa — Macizo Urrieles', 2524, 43.198056, -4.851111, FALSE),
  ('pico-de-boada', 'Pico de Boada', 'Asturias — Picos de Europa — Macizo Urrieles', 2523, 43.198056, -4.851111, FALSE),
  ('aguja-de-la-canalona', 'Aguja de la Canalona', 'Cantabria — Picos de Europa — Macizo Urrieles', 2519, 43.176439, -4.816747, FALSE),
  ('naranjo-de-bulnes', 'Naranjo de Bulnes', 'Asturias — Picos de Europa — Macizo Urrieles', 2519, 43.200000, -4.816669, FALSE),
  ('pico-arenizas-ii', 'Pico Arenizas II', 'Asturias/León — Picos de Europa — Macizo Urrieles', 2515, 43.189397, -4.839481, FALSE),
  ('horcados-rojos', 'Horcados Rojos', 'Asturias/Cantabria — Picos de Europa — Macizo Urrieles', 2503, 43.178300, -4.829720, FALSE),
  ('pico-arenizas-i', 'Pico Arenizas I', 'Asturias/León — Picos de Europa — Macizo Urrieles', 2504, 43.188594, -4.839572, FALSE),
  ('torre-de-las-coteras-rojas', 'Torre de las Coteras Rojas', 'Cantabria — Picos de Europa — Macizo Urrieles', 2502, 43.174700, -4.808330, FALSE),
  ('pico-arenizas-iii', 'Pico Arenizas III', 'Asturias/León — Picos de Europa — Macizo Urrieles', 2499, 43.187483, -4.839467, FALSE),
  ('aguja-de-los-cabrones-i', 'Aguja de los Cabrones I', 'Asturias — Picos de Europa — Macizo Urrieles', 2493, 43.198056, -4.851111, FALSE),
  ('torre-de-delgado-ubeda', 'Torre de Delgado Úbeda', 'León — Picos de Europa — Macizo Urrieles', 2485, 43.173300, -4.857220, FALSE),
  ('torre-diego-mella', 'Torre Diego Mella', 'León — Picos de Europa — Macizo Urrieles', 2485, 43.173300, -4.857220, FALSE),
  ('torre-del-hoyo-de-liordes', 'Torre del Hoyo de Liordes', 'León — Picos de Europa — Macizo Urrieles', 2477, 43.150850, -4.865700, FALSE),
  ('torre-de-enmedio', 'Torre de Enmedio', 'Asturias — Picos de Europa — Macizo Cornión', 2467, 43.203174, -4.968925, FALSE),
  ('torre-de-penalba', 'Torre de Peñalba', 'León — Picos de Europa — Macizo Urrieles', 2466, 43.176583, -4.866950, FALSE),
  ('torre-del-oso', 'Torre del Oso', 'Asturias — Picos de Europa — Macizo Urrieles', 2463, 43.200000, -4.816669, FALSE),
  ('aguja-jose-de-prado', 'Aguja José de Prado', 'Asturias/León — Picos de Europa — Macizo Cornión', 2463, 43.203174, -4.968925, FALSE),
  ('torre-de-la-celada', 'Torre de la Celada', 'León — Picos de Europa — Macizo Urrieles', 2459, 43.173300, -4.857220, FALSE),
  ('torre-de-la-horcada', 'Torre de la Horcada', 'Asturias — Picos de Europa — Macizo Cornión', 2455, 43.203174, -4.968925, FALSE),
  ('torre-del-torco', 'Torre del Torco', 'Asturias/León — Picos de Europa — Macizo Cornión', 2452, 43.203174, -4.968925, FALSE),
  ('torre-de-las-colladetas', 'Torre de las Colladetas', 'Asturias — Picos de Europa — Macizo Urrieles', 2449, 43.200000, -4.816669, FALSE),
  ('tiros-de-santiago', 'Tiros de Santiago', 'Asturias — Picos de Europa — Macizo Urrieles', 2447, 43.200000, -4.816669, FALSE),
  ('torre-de-salinas', 'Torre de Salinas', 'León — Picos de Europa — Macizo Urrieles', 2447, 43.148567, -4.860683, FALSE),
  ('torre-de-cebolleda-iii', 'Torre de Cebolleda III', 'Asturias — Picos de Europa — Macizo Cornión', 2445, 43.203174, -4.968925, FALSE),
  ('morra-lechugales', 'Morra Lechugales', 'Asturias/Cantabria — Picos de Europa — Macizo Ándara', 2444, 43.190100, -4.733840, FALSE),
  ('torre-del-friero', 'Torre del Friero', 'León — Picos de Europa — Macizo Urrieles', 2443, 43.157283, -4.875183, FALSE),
  ('neveron-del-albo', 'Neverón del Albo', 'Asturias — Picos de Europa — Macizo Urrieles', 2443, 43.198056, -4.851111, FALSE),
  ('pico-del-albo', 'Pico del Albo', 'Asturias — Picos de Europa — Macizo Urrieles', 2442, 43.198056, -4.851111, FALSE),
  ('pena-castil', 'Peña Castil', 'Asturias — Picos de Europa — Macizo Urrieles', 2439, 43.200000, -4.816669, FALSE),
  ('aguja-alpino', 'Aguja Alpino', 'Asturias/León — Picos de Europa — Macizo Cornión', 2438, 43.203174, -4.968925, FALSE),
  ('silla-del-caballo-cimero', 'Silla del Caballo Cimero', 'Cantabria — Picos de Europa — Macizo Ándara', 2436, 43.190733, -4.729436, FALSE),
  ('aguja-de-juan-menendez', 'Aguja de Juan Menéndez', 'Asturias/León — Picos de Europa — Macizo Cornión', 2435, 43.203174, -4.968925, FALSE),
  ('aguja-cimadevilla', 'Aguja Cimadevilla', 'Asturias/León — Picos de Europa — Macizo Cornión', 2432, 43.203174, -4.968925, FALSE),
  ('aguja-jovellanos', 'Aguja Jovellanos', 'Asturias/León — Picos de Europa — Macizo Cornión', 2430, 43.203174, -4.968925, FALSE),
  ('torre-del-hoyo-oscuro', 'Torre del Hoyo Oscuro', 'Cantabria — Picos de Europa — Macizo Urrieles', 2429, 43.166050, -4.837433, FALSE),
  ('torre-del-carnizoso', 'Torre del Carnizoso', 'Asturias — Picos de Europa — Macizo Urrieles', 2428, 43.200000, -4.816669, FALSE),
  ('torre-de-las-tres-marias-i', 'Torre de las Tres Marías I', 'Asturias — Picos de Europa — Macizo Cornión', 2420, 43.203174, -4.968925, FALSE),
  ('torre-de-cebolleda-ii', 'Torre de Cebolleda II', 'Asturias — Picos de Europa — Macizo Cornión', 2420, 43.203174, -4.968925, FALSE),
  ('torres-areneras', 'Torres Areneras', 'Asturias — Picos de Europa — Macizo Urrieles', 2419, 43.198056, -4.851111, FALSE),
  ('torre-de-las-tres-marias-ii', 'Torre de las Tres Marías II', 'Asturias — Picos de Europa — Macizo Cornión', 2417, 43.203174, -4.968925, FALSE),
  ('porro-del-torco', 'Porro del Torco', 'Asturias/León — Picos de Europa — Macizo Cornión', 2415, 43.203174, -4.968925, FALSE),
  ('cuchalon-de-villasobrada', 'Cuchalón de Villasobrada', 'Asturias — Picos de Europa — Macizo Urrieles', 2414, 43.200000, -4.816669, FALSE),
  ('cueto-albo', 'Cueto Albo', 'Asturias — Picos de Europa — Macizo Urrieles', 2414, 43.198056, -4.851111, FALSE),
  ('pena-olvidada', 'Peña Olvidada', 'Cantabria — Picos de Europa — Macizo Urrieles', 2406, 43.167298, -4.809206, FALSE),
  ('torre-bermeja-cornion', 'Torre Bermeja', 'León — Picos de Europa — Macizo Cornión', 2400, 43.172910, -5.021174, FALSE)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO challenge (name, slug, country)
VALUES ('Picos de Europa', 'picos-de-europa', 'ESP');

INSERT INTO challenge_has_mountain (challenge_id, mountain_id)
SELECT
  (SELECT id FROM challenge WHERE slug = 'picos-de-europa'),
  id
FROM mountain
WHERE slug IN ('torrecerredo', 'torre-del-llambrion', 'torre-del-tiro-tirso', 'torre-sin-nombre', 'torre-casiano-de-prado', 'pena-vieja', 'torre-bermeja', 'torre-del-hoyo-grande', 'torre-del-tiro-navarro-i', 'pico-de-santa-ana-i', 'pico-de-santa-ana-ii', 'torre-del-tiro-navarro-ii', 'torre-santa', 'torre-de-las-minas-del-carbon', 'torre-de-coello', 'torre-del-tiro-del-oso', 'los-campanarios-ii', 'los-campanarios-i', 'los-campanarios-iii', 'torre-del-tiro-llago', 'risco-saint-saud', 'neveron-de-urriellu', 'la-morra', 'pico-de-los-cabrones', 'los-campanarios-iv', 'torre-de-labrouche', 'pico-de-boada', 'aguja-de-la-canalona', 'naranjo-de-bulnes', 'pico-arenizas-ii', 'horcados-rojos', 'pico-arenizas-i', 'torre-de-las-coteras-rojas', 'pico-arenizas-iii', 'aguja-de-los-cabrones-i', 'pena-santa-enol', 'torre-de-delgado-ubeda', 'torre-diego-mella', 'torre-del-hoyo-de-liordes', 'torre-de-enmedio', 'torre-de-penalba', 'torre-del-oso', 'aguja-jose-de-prado', 'torre-de-la-celada', 'torre-de-la-horcada', 'torre-del-torco', 'torre-de-las-colladetas', 'tiros-de-santiago', 'torre-de-salinas', 'torre-de-cebolleda-iii', 'morra-lechugales', 'torre-del-friero', 'neveron-del-albo', 'pico-del-albo', 'pena-castil', 'aguja-alpino', 'silla-del-caballo-cimero', 'aguja-de-juan-menendez', 'aguja-cimadevilla', 'aguja-jovellanos', 'torre-del-hoyo-oscuro', 'torre-del-carnizoso', 'torre-de-las-tres-marias-i', 'torre-de-cebolleda-ii', 'torres-areneras', 'torre-de-las-tres-marias-ii', 'porro-del-torco', 'cuchalon-de-villasobrada', 'cueto-albo', 'pena-olvidada', 'torre-bermeja-cornion');
