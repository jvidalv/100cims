-- Backfill image_url for the 23 new Techos Provinciales peaks that have a
-- freely licensed Wikimedia Commons hero shot. The 25 pre-existing summits
-- (Teide, Aneto, Mulhacén, Pica d'Estats, etc.) already carry their seed
-- images.
--
-- Photos uploaded to S3 under 100cims/mountain/profile/<slug>.jpg, served via
-- CloudFront. Shared cache-buster timestamp (1779553022219) follows the
-- seed-data convention.
--
-- Still imageless (3 of 47): coto-pilar (A Coruña), la-banuela (Ciudad Real),
-- las-atalayas (Albacete) -- no usable free Commons photo at the time. UI
-- falls back to the country-flag avatar for those until manually sourced.
--
-- Commons sources (attribution kept here for the record):
--   costa-cabirolera     -- File:Costa Cabirolera.JPG, CC BY-SA 3.0, Pasdeguia
--   torre-blanca         -- File:Picos de Europa 1975 10.jpg, CC BY-SA 4.0, LBM1948
--   pena-prieta-sur      -- File:Peña Prieta y Pico Infierno.jpg, CC BY-SA 4.0, Goldorak
--   pena-trevinca        -- File:Pena Trevinca.jpg, CC0, O Breixo
--   o-mustallar          -- File:Mustallar Ancares.jpg, CC BY-SA 4.0, Tanja Freibott
--   faro-de-avion        -- File:Serra do Faro de Avión.jpg, PD-self, Noucho
--   almanzor             -- File:Almanzor sierra de gredos.jpg, CC BY-SA 3.0, Nachosan
--   canchal-de-la-ceja   -- File:Ávila (provincia) 1976 13.jpg, CC BY-SA 4.0, LBM1948
--   calvitero            -- File:Calvitero 1976 18.jpg, CC BY-SA 4.0, LBM1948
--   moncayo              -- File:Vista del Moncayo, España, 2021-12-31, DD 18.jpg, CC BY-SA 4.0, Diego Delso
--   san-lorenzo          -- File:La Rioja 1974 04.jpg, CC BY-SA 4.0, LBM1948
--   san-millan           -- File:Torruco-San Millán 2131 m.JPG, CC BY-SA 4.0, Lademandamanda
--   penarroya            -- File:Cim del Peñarroya, Alcalà de la Selva 01.jpg, CC BY-SA 4.0, Pacopac
--   mogorrita            -- File:Mogorrita.jpg, CC BY-SA 3.0, Vanbasten 23
--   alto-de-las-barracas -- File:Alto de las Barracas desde El Gavilán.JPG, CC BY-SA 3.0, Falconaumanni
--   corocho-de-rocigalgo -- File:Pico Rocigalgo Los Navalucillos.jpg, CC BY-SA 4.0, Nieves Colino Martínez
--   tentudia             -- File:20190518-tentudia.jpg, CC BY-SA 4.0, Moarardelasatr
--   cuchillejo           -- File:VG nº 37452 IGN Cuchillejo.jpg, CC0, Caçavertex
--   la-maroma            -- File:La Maroma 2.jpg, CC BY-SA 4.0, Adam Cli
--   los-obispos          -- File:Macizo de Revolcadores, … cara sur.jpg, PD-self, Lionni
--   puig-major           -- File:Mallorca Puig Major February 2018-4124.jpg, CC BY-SA 4.0, Isiwal
--   monte-anyera         -- File:Fuerte de Ányera, Ceuta.jpg, CC BY-SA 3.0, Hansi_2010
--   rostrogordo          -- File:Fuerte de Rostrogordo.jpg, CC BY-SA 4.0, MONUMENTA

UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/costa-cabirolera.jpg?date=1779553022219' WHERE slug = 'costa-cabirolera';
UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/torre-blanca.jpg?date=1779553022219' WHERE slug = 'torre-blanca';
UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/pena-prieta-sur.jpg?date=1779553022219' WHERE slug = 'pena-prieta-sur';
UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/pena-trevinca.jpg?date=1779553022219' WHERE slug = 'pena-trevinca';
UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/o-mustallar.jpg?date=1779553022219' WHERE slug = 'o-mustallar';
UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/faro-de-avion.jpg?date=1779553022219' WHERE slug = 'faro-de-avion';
UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/almanzor.jpg?date=1779553022219' WHERE slug = 'almanzor';
UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/canchal-de-la-ceja.jpg?date=1779553022219' WHERE slug = 'canchal-de-la-ceja';
UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/calvitero.jpg?date=1779553022219' WHERE slug = 'calvitero';
UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/moncayo.jpg?date=1779553022219' WHERE slug = 'moncayo';
UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/san-lorenzo.jpg?date=1779553022219' WHERE slug = 'san-lorenzo';
UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/san-millan.jpg?date=1779553022219' WHERE slug = 'san-millan';
UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/penarroya.jpg?date=1779553022219' WHERE slug = 'penarroya';
UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/mogorrita.jpg?date=1779553022219' WHERE slug = 'mogorrita';
UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/alto-de-las-barracas.jpg?date=1779553022219' WHERE slug = 'alto-de-las-barracas';
UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/corocho-de-rocigalgo.jpg?date=1779553022219' WHERE slug = 'corocho-de-rocigalgo';
UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/tentudia.jpg?date=1779553022219' WHERE slug = 'tentudia';
UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/cuchillejo.jpg?date=1779553022219' WHERE slug = 'cuchillejo';
UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/la-maroma.jpg?date=1779553022219' WHERE slug = 'la-maroma';
UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/los-obispos.jpg?date=1779553022219' WHERE slug = 'los-obispos';
UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/puig-major.jpg?date=1779553022219' WHERE slug = 'puig-major';
UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/monte-anyera.jpg?date=1779553022219' WHERE slug = 'monte-anyera';
UPDATE mountain SET image_url = 'https://dg49c3nlr5rbl.cloudfront.net/100cims/mountain/profile/rostrogordo.jpg?date=1779553022219' WHERE slug = 'rostrogordo';
