-- Sostres comarcals de Catalunya: the high point of each of the 41 comarques.
-- Source: ca.wikipedia.org/wiki/Llista_dels_sostres_comarcals_de_Catalunya
-- 43 comarques but 41 distinct summits -- Sant Jeroni de Montserrat is the roof of
-- both l'Anoia and el Bages, and the Tossal de la Baltasana that of both el Baix Camp
-- and la Conca de Barbera.
--
-- 29 of the 41 summits already exist (most from the FEEC 100 cims seed); ON CONFLICT
-- preserves them. The 12 below are the comarcal roofs not yet in the catalogue. They
-- keep image_url = NULL -- the UI falls back to the country-flag avatar until photos
-- are sourced. Coordinates from the Wikipedia table (WGS84).
--
-- Three summits marked essential -- the three-thousanders: Pica d'Estats (the roof of
-- Catalonia), Comaloforno and Tuc de Molieres.

INSERT INTO mountain (slug, name, location, height, latitude, longitude, essential)
VALUES
  ('puigsou', 'Puigsou', 'Serralada Transversal, Gironès', 991, 42.072481, 2.686111, FALSE),
  ('comaestremer', 'Comaestremer', 'Serra de Portelles, Pla de l''Estany', 886, 42.083250, 2.682389, FALSE),
  ('puig-daiguabona', 'Puig d''Aiguabona', 'Les Gavarres, Baix Empordà', 533, 41.887333, 2.990389, FALSE),
  ('puigdon', 'Puigdon', 'Serra de Sovelles, Lluçanès', 1207, 42.143111, 2.092911, FALSE),
  ('serrat-de-sant-joan', 'Serrat de Sant Joan', 'Serralada Prelitoral, Moianès', 1069, 41.845600, 2.145608, FALSE),
  ('tossal-de-les-torretes', 'Tossal de les Torretes', 'Montsec de Rúbies, Noguera', 1676, 42.021986, 0.938342, FALSE),
  ('turo-del-galutxo', 'Turó del Galutxo', 'Depressió Central, Segarra', 852, 41.555125, 1.380869, FALSE),
  ('puntal-dels-escambrons', 'Puntal dels Escambrons', 'Depressió Central, Segrià', 500, 41.276058, 0.432656, FALSE),
  ('tossal-de-linfern', 'Tossal de l''Infern', 'Depressió Central, Pla d''Urgell', 301, 41.594433, 0.869908, FALSE),
  ('turo-den-vives', 'Turó d''en Vives', 'Massís del Montnegre, Maresme', 766, 41.659222, 2.555194, FALSE),
  ('tibidabo', 'Tibidabo', 'Serra de Collserola, Barcelonès', 516, 41.422500, 2.118610, FALSE),
  ('roca-de-migdia', 'Roca de Migdia', 'Muntanyes de Prades, Alt Camp', 1022, 41.292531, 1.061511, FALSE)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO challenge (name, slug, country, emoji)
VALUES ('Sostres Comarcals de Catalunya', 'sostres-comarcals', 'ESP', '🗺️');

INSERT INTO challenge_has_mountain (challenge_id, mountain_id)
SELECT (SELECT id FROM challenge WHERE slug = 'sostres-comarcals'), id
FROM mountain
WHERE slug IN (
  -- Pirineu
  'pica-destats', 'pic-de-comaloforno', 'tuc-de-molieres', 'pic-de-peguera',
  'puigpedros', 'pic-de-saloria', 'puigmal', 'comanegra', 'roc-del-comptador',
  -- Catalunya Central / Prepirineu
  'pic-de-costa-cabirolera', 'pedro-dels-quatre-batlles', 'matagalls',
  'sant-jeroni', 'puigdon', 'serrat-de-sant-joan', 'tossal-de-les-torretes',
  -- Terres de Ponent
  'punta-del-curull', 'turo-del-galutxo', 'tossal-gros-de-vallbona',
  'puntal-dels-escambrons', 'tossal-de-linfern',
  -- Comarques gironines
  'les-agudes', 'puigsou', 'comaestremer', 'puig-daiguabona',
  -- Àmbit metropolità
  'turo-de-lhome', 'lalbarda-castellana', 'la-mola-de-sant-llorenc-del-munt',
  'puig-dagulles', 'turo-den-vives', 'puig-de-la-mola', 'tibidabo',
  -- Camp de Tarragona / Terres de l'Ebre
  'caro', 'tossal-dels-tres-reis', 'tosseta-rasa', 'xaquera-o-creu-de-santos',
  'tossal-de-la-baltasana', 'roca-corbatera', 'roca-de-migdia',
  'talaia-del-montmell', 'la-mola'
);
