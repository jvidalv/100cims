-- 100 Cims LICC (Repte dels 100 Cims de la Lliga Independent de Clubs de
-- Comarques / ICC): 103 summits spanning Catalonia from coastal hills to the
-- 3000 m Pyrenean peaks. Source list provided by the user (UTM31N ETRS89
-- coordinates), converted to WGS84 and matched against the catalogue by
-- proximity (<300 m).
--
-- 87 of the 103 summits already exist in the catalogue and are linked below;
-- ON CONFLICT preserves them. The 16 below are the peaks not yet present.
-- Coordinates are the WGS84 conversion of the source UTM31N easting/northing;
-- profile images are hosted on our own CDN (uploaded from Wikimedia Commons).
--
-- Note: the coastal 'Montigalar' (152 m, Serralada de Marina) is a different
-- peak from the existing 'montigalar' (464 m, near Girona), so it gets the
-- distinct slug 'montigalar-tiana' to avoid an ON CONFLICT collision.

INSERT INTO mountain (slug, name, location, height, latitude, longitude, essential, image_url)
VALUES
  ('montigalar-tiana', 'Montigalar', 'Serralada de Marina, Barcelonès', 152, 41.464752, 2.231114, FALSE, 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/montigalar-tiana.jpg'),
  ('montjuic', 'Montjuïc', 'Barcelona, Barcelonès', 178, 41.364020, 2.164711, FALSE, 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/montjuic.jpg'),
  ('puig-de-sant-martiria', 'Puig de Sant Martirià', 'Banyoles, Pla de l''Estany', 242, 42.131863, 2.763235, FALSE, 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/puig-de-sant-martiria.jpg'),
  ('muntanya-del-montgri', 'Muntanya del Montgrí', 'Massís del Montgrí, Baix Empordà', 308, 42.057965, 3.120566, FALSE, 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/muntanya-del-montgri.jpg'),
  ('sant-mateu', 'Sant Mateu', 'Serralada Litoral, Vallès Oriental', 499, 41.515516, 2.326743, FALSE, 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/sant-mateu.jpg'),
  ('volca-del-montsacopa', 'Volcà del Montsacopa', 'Olot, Garrotxa', 532, 42.187259, 2.488976, FALSE, 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/volca-del-montsacopa.jpg'),
  ('turo-de-cellecs', 'Turó de Céllecs', 'Serralada Litoral, Vallès Oriental', 536, 41.556811, 2.338287, FALSE, 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/turo-de-cellecs.jpg'),
  ('el-peni', 'el Pení', 'Cap de Creus, Alt Empordà', 608, 42.281401, 3.243207, FALSE, 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/el-peni.jpg'),
  ('tossa-de-montbui', 'Tossa de Montbui', 'Santa Margarida de Montbui, Anoia', 620, 41.557017, 1.581512, FALSE, 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/tossa-de-montbui.jpg'),
  ('turo-gros', 'Turó Gros', 'Montnegre, Maresme', 758, 41.661483, 2.576377, FALSE, 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/turo-gros.jpg'),
  ('volca-de-santa-margarida', 'Volcà de Santa Margarida', 'Zona Volcànica de la Garrotxa', 766, 42.141422, 2.543914, FALSE, 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/volca-de-santa-margarida.jpg'),
  ('la-mussara', 'la Mussara', 'Muntanyes de Prades, Baix Camp', 1055, 41.257945, 1.055458, FALSE, 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/la-mussara.jpg'),
  ('roca-alta', 'Roca Alta', 'Serra de Busa, Solsonès', 1438, 42.021256, 1.010221, FALSE, 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/roca-alta.jpg'),
  ('montfalgars', 'Montfalgars', 'Alta Garrotxa, Garrotxa', 1611, 42.363233, 2.456914, FALSE, 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/montfalgars.jpg'),
  ('el-pedro', 'el Pedró', 'Serra de Sant Marc, Ripollès', 1765, 42.202720, 1.948923, FALSE, 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/el-pedro.jpg'),
  ('cap-d-urdet', 'Cap d''Urdet', 'Serra del Verd, Alt Urgell', 2240, 42.196612, 1.640472, FALSE, 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/cap-d-urdet.jpg')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO challenge (name, slug, country, emoji)
VALUES ('100 Cims LICC', '100-cims-licc', 'ESP', '🏔️');

INSERT INTO challenge_has_mountain (challenge_id, mountain_id)
SELECT (SELECT id FROM challenge WHERE slug = '100-cims-licc'), id
FROM mountain
WHERE slug IN (
  'el-montsianell', 'pilar-dalmenara', 'els-angels', 'montmeneu',
  'puig-cadiretes', 'puig-darques', 'montau', 'castell-saverdera',
  'mola-de-genessies', 'santa-barbara', 'torreta-del-montsia', 'tossal-gros-de-vallbona',
  'puiggracios', 'pic-del-vent', 'talaia-del-montmell', 'miranda-de-llaberia',
  'mola-de-colldejou', 'punta-del-general', 'xaquera-o-creu-de-santos', 'roques-de-benet-el-castell',
  'puigsallanca', 'tagamanent', 'la-mola-de-sant-llorenc-del-munt', 'el-mont',
  'el-far', 'roca-corbatera', 'mola-de-lord', 'tossal-de-la-baltasana',
  'sant-miquel-de-solterra', 'sant-jeroni', 'bellmunt', 'puig-neulos',
  'cabrera', 'el-negrell', 'tossal-dels-tres-reis', 'sant-corneli',
  'bassegoda', 'caro', 'roc-del-comptador', 'puigsacalm',
  'castell-de-milany', 'pedro-de-tubau', 'comanegra', 'el-coscollet',
  'penya-sant-alis', 'matagalls', 'les-agudes', 'turo-de-lhome',
  'cogullo-destela', 'taga', 'cap-de-boumort', 'montcorbison',
  'penyes-altes', 'cap-de-la-gallina-pelada', 'pedro-dels-quatre-batlles', 'puigllancada',
  'costabona', 'pollego-superior-pedraforca', 'montlude', 'la-tosa',
  'comabona', 'torreta-del-cadi', 'balandrau', 'tuc-de-marimanya',
  'gra-de-fajol', 'gran-encantat', 'pic-de-saloria', 'montardo',
  'mont-roig', 'pic-de-linfern', 'bastiments', 'mauberme',
  'malh-des-pois-la-forcanada', 'montsent-de-pallars', 'tossa-plana-de-lles-pic-de-la-portelleta', 'monteixo',
  'puigmal', 'puigpedros', 'gran-tuc-de-colomers', 'pic-de-subenuix',
  'pic-de-peguera', 'besiberri-nord', 'tuc-de-molieres', 'punta-alta',
  'pic-de-comaloforno', 'pic-de-sotllo', 'pica-destats', 'montigalar-tiana',
  'montjuic', 'puig-de-sant-martiria', 'muntanya-del-montgri', 'sant-mateu',
  'volca-del-montsacopa', 'turo-de-cellecs', 'el-peni', 'tossa-de-montbui',
  'turo-gros', 'volca-de-santa-margarida', 'la-mussara', 'roca-alta',
  'montfalgars', 'el-pedro', 'cap-d-urdet'
);
