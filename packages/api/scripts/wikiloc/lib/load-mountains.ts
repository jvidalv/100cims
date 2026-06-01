import { readdirSync, readFileSync } from "fs";
import { resolve } from "path";

import type { Target } from "./scrape-mountain";

// We pull mountains straight from the seed SQL so the script needs zero
// hardcoded targets. Re-parsing the seed each run is fine — it's a few KB and
// reads in <10ms. Once 100cims has more mountains being added live this can
// move to a DB query, but the seed is the canonical source for now.

const DRIZZLE_DIR = resolve(__dirname, "../../../src/db/drizzle");

// Wikiloc Catalonia spans ~3° lng × 2° lat; a 0.18° radius (~20km) is wide
// enough to catch trails starting at a nearby village without inviting many
// false positives from neighbouring peaks.
const DEFAULT_BBOX_RADIUS_DEG = 0.18;

const bboxAround = (lat: number, lng: number, radius: number) => ({
  swLat: lat - radius,
  swLng: lng - radius,
  neLat: lat + radius,
  neLng: lng + radius,
});

// Catalan / Spanish punctuation cleanup for the Wikiloc search query. Wikiloc
// matches accent-folded so we don't need to strip accents, but the curly
// apostrophe in seed names ("d'Estats") often hurts recall vs a plain quote.
const queryFor = (name: string): string =>
  name
    .replace(/[‘’]/g, "'") // smart → straight quote
    .toLowerCase()
    .trim();

type SeedMountain = {
  slug: string;
  name: string;
  location: string;
  height: number;
  latitude: number;
  longitude: number;
};

const unescapeSqlString = (s: string): string => s.replace(/''/g, "'");

// Find every `INSERT INTO mountain (...) VALUES ... ;` block (one-row or
// multi-row form), then within each block extract every tuple. Two-stage
// because the original single-pattern regex only matched the FIRST tuple of
// multi-row inserts, silently dropping hundreds of mountains.
const INSERT_BLOCK_REGEX =
  /INSERT INTO mountain\s*\(([^)]*)\)\s*VALUES\s*([\s\S]*?);/g;

// Matches a single tuple in the VALUES body. Captures the first six columns
// — slug, name, location, height, latitude, longitude — which is all
// `SeedMountain` needs. The regex doesn't care what comes after; both the
// 11-column seed shape and the 7-column migration shape land here.
const TUPLE_REGEX =
  /\(\s*'([^']*(?:''[^']*)*)'\s*,\s*'([^']*(?:''[^']*)*)'\s*,\s*'([^']*(?:''[^']*)*)'\s*,\s*([\d.]+)\s*,\s*([\d.-]+)\s*,\s*([\d.-]+)/g;

// Collect SQL from the seed plus every migration that contains mountain
// INSERTs. The seed has the bulk of the catalogue; migrations like
// 0065_add-sostres-comarcals and 0073_add-techos-provinciales add the
// remaining peaks via ON CONFLICT DO NOTHING. Without scanning migrations
// we'd silently drop the slugs those challenges need.
//
// We strip SQL line comments first — `-- foo (3 new; bar)` contains a `;`
// that otherwise prematurely terminates our non-greedy block regex.
const stripLineComments = (sql: string): string => sql.replace(/--[^\n]*/g, "");

const readAllSql = (): string => {
  const files = readdirSync(DRIZZLE_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  return files
    .map((f) =>
      stripLineComments(readFileSync(resolve(DRIZZLE_DIR, f), "utf8")),
    )
    .join("\n");
};

export const loadAllMountains = (): SeedMountain[] => {
  const sql = readAllSql();
  const out: SeedMountain[] = [];
  const seen = new Set<string>();
  let block: RegExpExecArray | null;
  INSERT_BLOCK_REGEX.lastIndex = 0;
  while ((block = INSERT_BLOCK_REGEX.exec(sql)) !== null) {
    const valuesBody = block[2];
    let tuple: RegExpExecArray | null;
    // Fresh /g state for each block — `exec` on a new string starts at 0.
    TUPLE_REGEX.lastIndex = 0;
    while ((tuple = TUPLE_REGEX.exec(valuesBody)) !== null) {
      const slug = unescapeSqlString(tuple[1]);
      // Dedupe: a slug might be inserted by the seed then re-asserted by a
      // migration's ON CONFLICT DO NOTHING. Keep the first occurrence.
      if (seen.has(slug)) continue;
      seen.add(slug);
      out.push({
        slug,
        name: unescapeSqlString(tuple[2]),
        location: unescapeSqlString(tuple[3]),
        height: parseFloat(tuple[4]),
        latitude: parseFloat(tuple[5]),
        longitude: parseFloat(tuple[6]),
      });
    }
  }
  return out;
};

export const toTarget = (m: SeedMountain): Target => ({
  slug: m.slug,
  name: m.name.replace(/[‘’]/g, "'"),
  location: m.location,
  heightMeters: m.height,
  query: queryFor(m.name),
  bbox: bboxAround(m.latitude, m.longitude, DEFAULT_BBOX_RADIUS_DEG),
});

/**
 * Filter mountains by a substring match in the seed's `location` column.
 * Case-insensitive, matches anywhere in the string. Used by the comarca
 * sub-commands ("Terra Alta", "Alt Empordà", etc.).
 */
export const loadMountainsByLocation = (needle: string): SeedMountain[] => {
  const all = loadAllMountains();
  const lower = needle.toLowerCase();
  return all.filter((m) => m.location.toLowerCase().includes(lower));
};

// Explicit slug lists for the challenges defined in the seed migrations.
// The seed's `challenge_has_mountain` join sometimes uses `SELECT * FROM
// mountain` (100 Cims, Aragón) so the join table isn't a reliable filter.
// For each challenge we either:
//   - filter by URL pattern (100 Cims uses the canonical FEEC URL), or
//   - keep an explicit slug list mirroring the migration's WHERE clause.
const SOSTRES_COMARCALS_SLUGS = new Set<string>([
  // Pirineu
  "pica-destats",
  "pic-de-comaloforno",
  "tuc-de-molieres",
  "pic-de-peguera",
  "puigpedros",
  "pic-de-saloria",
  "puigmal",
  "comanegra",
  "roc-del-comptador",
  // Catalunya Central / Prepirineu
  "pic-de-costa-cabirolera",
  "pedro-dels-quatre-batlles",
  "matagalls",
  "sant-jeroni",
  "puigdon",
  "serrat-de-sant-joan",
  "tossal-de-les-torretes",
  // Terres de Ponent
  "punta-del-curull",
  "turo-del-galutxo",
  "tossal-gros-de-vallbona",
  "puntal-dels-escambrons",
  "tossal-de-linfern",
  // Comarques gironines
  "les-agudes",
  "puigsou",
  "comaestremer",
  "puig-daiguabona",
  // Àmbit metropolità
  "turo-de-lhome",
  "lalbarda-castellana",
  "la-mola-de-sant-llorenc-del-munt",
  "puig-dagulles",
  "turo-den-vives",
  "puig-de-la-mola",
  "tibidabo",
  // Camp de Tarragona / Terres de l'Ebre
  "caro",
  "tossal-dels-tres-reis",
  "tosseta-rasa",
  "xaquera-o-creu-de-santos",
  "tossal-de-la-baltasana",
  "roca-corbatera",
  "roca-de-migdia",
  "talaia-del-montmell",
  "la-mola",
]);

const TECHOS_PROVINCIALES_SLUGS = new Set<string>([
  // Pirineos
  "aneto",
  "pica-destats",
  "puigpedros",
  "hiru-erregeen-mahaia",
  "costa-cabirolera",
  // Cordillera Cantábrica & País Vasco
  "torrecerredo",
  "torre-blanca",
  "pena-prieta-sur",
  "gorbeia",
  "aketegi",
  // Galicia
  "pena-trevinca",
  "o-mustallar",
  "faro-de-avion",
  "coto-pilar",
  // Sistema Central
  "almanzor",
  "penalara",
  "canchal-de-la-ceja",
  "calvitero",
  "pico-del-lobo",
  // Sistema Ibérico
  "moncayo",
  "san-lorenzo",
  "san-millan",
  "penarroya",
  "mogorrita",
  "alto-de-las-barracas",
  "penyagolosa",
  // Montes de Toledo / Sierra Morena / interior
  "corocho-de-rocigalgo",
  "la-banuela",
  "el-terril",
  "tentudia",
  "los-bonales",
  "cuchillejo",
  // Andalucía / Béticas
  "mulhacen",
  "chullo",
  "pico-magina",
  "la-maroma",
  "pico-tinosa",
  "el-torreon",
  // Sureste & Levante
  "sierra-de-aitana",
  "los-obispos",
  "las-atalayas",
  "caro",
  // Islas
  "teide",
  "pico-de-las-nieves",
  "puig-major",
  // Ciudades autónomas
  "monte-anyera",
  "rostrogordo",
]);

const ARAGON_SLUGS = new Set<string>([
  "aneto",
  "monte-perdido",
  "posets",
  "pico-de-aspe",
  "pico-anayet",
  "pico-de-tendeñera",
  "tozal-de-guara",
  "pico-del-mondoto",
  "peña-montañesa",
  "peña-telera",
  "peña-foratata",
  "peña-mediodía",
  "peña-roya",
  "peña-melera",
  "pico-de-la-pala",
  "pico-balaitus",
  "pico-marboré",
  "pico-cilindro",
  "peña-collarada",
  "pico-del-infierno",
]);

// Slug lists extracted from the seed migrations' challenge_has_mountain
// inserts (0001_seed-data.sql, 0043_add-picos-de-europa-challenge.sql,
// 0051_add-cumbres-alicante-challenge.sql). Each set mirrors the WHERE
// slug IN (...) clause used to populate the join table for the challenge.
const ISLAS_CANARIAS_SLUGS = new Set<string>([
  "teide",
  "roque-de-los-muchachos",
  "pico-de-las-nieves",
  "montaña-de-tirma",
  "montaña-roja",
  "montaña-blanca",
  "guajara",
  "roque-nublo",
]);

const CUMBRES_DEL_LEVANTE_SLUGS = new Set<string>([
  "pico-calderon",
  "penyagolosa",
  "pico-gavilan",
  "sierra-de-aitana",
  "puig-campana",
  "alto-de-santa-barbara",
  "el-cabezo",
  "cim-del-ponig",
  "caroche",
  "benicadell",
  "pico-espadan",
  "pico-nono",
  "sierra-de-bernia",
  "pico-elvira",
  "pico-batalla",
  "bellota",
  "pico-del-ave",
  "puntal-de-aljub",
  "cima-el-carrascal",
  "pico-monduver",
  "cima-del-picacho",
  "montgo",
  "el-garbi",
]);

const PICOS_DE_EUROPA_SLUGS = new Set<string>([
  "torrecerredo",
  "torre-del-llambrion",
  "torre-del-tiro-tirso",
  "torre-sin-nombre",
  "torre-casiano-de-prado",
  "pena-vieja",
  "torre-bermeja",
  "torre-del-hoyo-grande",
  "torre-del-tiro-navarro-i",
  "pico-de-santa-ana-i",
  "pico-de-santa-ana-ii",
  "torre-del-tiro-navarro-ii",
  "torre-santa",
  "torre-de-las-minas-del-carbon",
  "torre-de-coello",
  "torre-del-tiro-del-oso",
  "los-campanarios-ii",
  "los-campanarios-i",
  "los-campanarios-iii",
  "torre-del-tiro-llago",
  "risco-saint-saud",
  "neveron-de-urriellu",
  "la-morra",
  "pico-de-los-cabrones",
  "los-campanarios-iv",
  "torre-de-labrouche",
  "pico-de-boada",
  "aguja-de-la-canalona",
  "naranjo-de-bulnes",
  "pico-arenizas-ii",
  "horcados-rojos",
  "pico-arenizas-i",
  "torre-de-las-coteras-rojas",
  "pico-arenizas-iii",
  "aguja-de-los-cabrones-i",
  "pena-santa-enol",
  "torre-de-delgado-ubeda",
  "torre-diego-mella",
  "torre-del-hoyo-de-liordes",
  "torre-de-enmedio",
  "torre-de-penalba",
  "torre-del-oso",
  "aguja-jose-de-prado",
  "torre-de-la-celada",
  "torre-de-la-horcada",
  "torre-del-torco",
  "torre-de-las-colladetas",
  "tiros-de-santiago",
  "torre-de-salinas",
  "torre-de-cebolleda-iii",
  "morra-lechugales",
  "torre-del-friero",
  "neveron-del-albo",
  "pico-del-albo",
  "pena-castil",
  "aguja-alpino",
  "silla-del-caballo-cimero",
  "aguja-de-juan-menendez",
  "aguja-cimadevilla",
  "aguja-jovellanos",
  "torre-del-hoyo-oscuro",
  "torre-del-carnizoso",
  "torre-de-las-tres-marias-i",
  "torre-de-cebolleda-ii",
  "torres-areneras",
  "torre-de-las-tres-marias-ii",
  "porro-del-torco",
  "cuchalon-de-villasobrada",
  "cueto-albo",
  "pena-olvidada",
  "torre-bermeja-cornion",
]);

const CUMBRES_ALICANTE_SLUGS = new Set<string>([
  "sierra-de-aitana",
  "puig-campana",
  "montcabrer",
  "serrella",
  "el-menejador",
  "maigmo",
  "cabeco-dor",
  "cim-del-ponig",
  "sierra-de-bernia",
  "montgo",
  "penon-de-ifach",
]);

const CUMBRES_ASTURES_SLUGS = new Set<string>([
  "torrecerredo",
  "torre-bermeja",
  "tesorero",
  "naranjo-de-bulnes",
  "pena-santa-enol",
  "morra-lechugales",
  "pena-ubina",
  "el-fontan",
  "la-verdilluenga",
  "pena-orniz",
  "cornon",
  "farinentu",
  "pena-rueda",
  "munon",
  "cueto-cabras",
  "torres",
  "pena-pilenes",
  "pena-viento",
  "tiatordos",
  "la-tesa",
  "el-retrinon",
  "picu-michu",
  "pena-main",
  "la-cabra",
  "la-mostayal",
  "pienzu",
]);

const MONTES_GALLEGOS_SLUGS = new Set<string>([
  "pena-trevinca",
  "pena-negra",
  "pena-surbia",
  "alto-ladeira-de-la-medias",
  "cuina",
  "mustallar",
  "tres-bispos",
  "cabeza-de-manzaneda",
  "seixo",
  "formigueiros",
  "piapaxaro",
  "faro",
  "el-turrieiro",
  "a-nevosa",
  "alto-do-couto",
  "penagache",
  "monte-faro",
  "pico-de-los-cuatro-caballeros",
  "monte-coco",
  "monte-farelo",
  "pena-grande",
  "monseivane",
  "el-candan",
  "monte-de-la-cova-de-la-serpe",
]);

const REPTE_DEL_GIRONES_SLUGS = new Set<string>([
  "puigsou-rocacorba",
  "castell-sant-miquel",
  "puig-cadiretes",
  "puig-maimi-sant-cristofol",
  "montigalar",
  "sant-grau",
  "el-rocas-santa-afra",
  "sants-metges-congost",
  "els-angels",
  "sant-roc-pas-historia",
]);

const TOP_SPAIN_SLUGS = new Set<string>([
  "mulhacen",
  "veleta",
  "vignemale",
  "torrecerredo",
  "aneto",
  "teide",
  "pica-destats",
  "roque-nublo",
  "monte-perdido",
  "pico-balaitus",
  "pico-del-infierno",
]);

const ALTOS_MADRILENOS_SLUGS = new Set<string>([
  "penalara",
  "cabezas-de-hierro",
  "pico-del-lobo",
  "pico-de-navahondilla",
  "la-maliciosa",
  "reajo-alto",
  "portacho-de-los-gavilanes",
  "pena-negra-cabrera",
  "pena-de-la-cabra",
  "alto-del-porrejon",
  "cabeza-lijar",
  "monte-abantos",
  "la-najarra",
  "el-yelmo",
  "cerro-del-barranco-de-la-cabeza",
  "cerro-san-benito",
  "cancho-gordo",
  "pico-del-fraile",
  "cerro-de-san-pedro",
  "machota-baja",
  "pico-de-la-miel",
  "cancho-de-la-cabeza",
  "pico-de-la-almenara",
  "pico-almojon",
  "cerro-del-ecce-homo",
]);

// Mirrors 0061_add-ehun-mendiak-challenge.sql — 100 Basque-Navarrese peaks.
const EHUN_MENDIAK_SLUGS = new Set<string>([
  "adarra", "adi", "aketegi", "alkaxuri", "alkurruntz", "anboto", "andarto",
  "arangoiti", "aratz", "arbarain", "arradoi", "arthanolatze", "artzamendi",
  "atxabal", "bachicabo", "baigura-areta", "baigura-lapurdi", "baio",
  "balerdi", "behorlegituturru", "beriain", "berrendi", "bianditz", "carrias",
  "dulantz", "erenozar", "eretza", "erga", "erlo", "ermua", "erroilbide",
  "errozate", "eskutxi", "etxauriko-haitzak", "etxekortea", "fraile",
  "ganekogorta", "gorbeia", "hauza", "hernio", "higa", "hiru-erregeen-mahaia",
  "illon", "intxorta", "iparla", "ireber", "irimo", "irulegi", "iturrigorri",
  "izarbe", "jaizkibel", "jata", "joar", "jorrios", "kanpanzar", "kapildui",
  "kolitza", "lapoblacion", "larhun", "larrogain", "larrunarri", "legate",
  "lekanda", "lokiz", "mendaur", "mondarrain", "montejurra", "pena-del-moro",
  "mugarra", "murugil", "ogono", "oiz", "okabe", "orhi", "oriol",
  "ortzantzurieta", "oteros", "palomares", "penablanca", "penalta",
  "perriain", "puttarri", "repico", "saioa", "san-pedro", "serantes", "soila",
  "sollazbizkargana", "sollube", "tolono", "txamantxoia", "txarlazo",
  "udalatx", "untzillatx", "urepel", "urko", "urkulu", "urtemondo", "uzturre",
  "zalama",
]);

/**
 * Filter mountains belonging to a known challenge. 100 Cims is matched via
 * the canonical FEEC URL pattern; the smaller challenges keep an explicit
 * slug list mirroring the migration that defines them. Add new challenges
 * by extending this switch — the seed's join table sometimes selects every
 * mountain so it can't be trusted as a filter.
 */
export const loadMountainsForChallenge = (
  challengeSlug: string,
): SeedMountain[] => {
  if (challengeSlug === "100-cims") {
    const all = loadAllMountainsWithUrls();
    // Structural drop of `url` so future SeedMountain fields propagate
    // automatically — an explicit field list silently omits new keys.
    return all
      .filter((m) => m.url?.includes("feec.cat/activitats/100-cims/cim/"))
      .map(({ url: _url, ...rest }) => rest);
  }
  const slugSet = (
    {
      "sostres-comarcals": SOSTRES_COMARCALS_SLUGS,
      "techos-provinciales": TECHOS_PROVINCIALES_SLUGS,
      aragon: ARAGON_SLUGS,
      "islas-canarias": ISLAS_CANARIAS_SLUGS,
      "cumbres-del-levante": CUMBRES_DEL_LEVANTE_SLUGS,
      "picos-de-europa": PICOS_DE_EUROPA_SLUGS,
      "cumbres-alicante": CUMBRES_ALICANTE_SLUGS,
      "cumbres-astures": CUMBRES_ASTURES_SLUGS,
      "montes-gallegos": MONTES_GALLEGOS_SLUGS,
      "repte-del-girones": REPTE_DEL_GIRONES_SLUGS,
      "top-spain": TOP_SPAIN_SLUGS,
      "altos-madrilenos": ALTOS_MADRILENOS_SLUGS,
      "ehun-mendiak": EHUN_MENDIAK_SLUGS,
    } as Record<string, Set<string>>
  )[challengeSlug];
  if (!slugSet) {
    throw new Error(`Unknown challenge slug: ${challengeSlug}`);
  }
  return loadAllMountains().filter((m) => slugSet.has(m.slug));
};

// Tuple regex that also captures the optional `url` column. The seed has
// two INSERT shapes for mountain: 11 columns (with utm coords + url + image)
// and 8 columns (just image_url). For the 8-column shape we DON'T have a
// canonical FEEC URL so the captured group is the image URL — but the
// 100 Cims filter checks for "feec.cat/.../100-cims/" which only the
// 11-column rows have, so the misattribution is harmless.
const TUPLE_WITH_URL_REGEX =
  /\(\s*'([^']*(?:''[^']*)*)'\s*,\s*'([^']*(?:''[^']*)*)'\s*,\s*'([^']*(?:''[^']*)*)'\s*,\s*([\d.]+)\s*,\s*([\d.-]+)\s*,\s*([\d.-]+)\s*,\s*(?:TRUE|FALSE)\s*,(?:\s*[\d.-]+\s*,\s*[\d.-]+\s*,)?\s*(?:'([^']*(?:''[^']*)*)'|NULL)/g;

type SeedMountainWithUrl = SeedMountain & { url: string | null };

const loadAllMountainsWithUrls = (): SeedMountainWithUrl[] => {
  const sql = readAllSql();
  const out: SeedMountainWithUrl[] = [];
  let block: RegExpExecArray | null;
  // Reuse INSERT_BLOCK_REGEX state — `exec` keeps a per-instance lastIndex
  // so we have to reset it on entry to avoid cross-call corruption.
  INSERT_BLOCK_REGEX.lastIndex = 0;
  while ((block = INSERT_BLOCK_REGEX.exec(sql)) !== null) {
    const valuesBody = block[2];
    let tuple: RegExpExecArray | null;
    TUPLE_WITH_URL_REGEX.lastIndex = 0;
    while ((tuple = TUPLE_WITH_URL_REGEX.exec(valuesBody)) !== null) {
      out.push({
        slug: unescapeSqlString(tuple[1]),
        name: unescapeSqlString(tuple[2]),
        location: unescapeSqlString(tuple[3]),
        height: parseFloat(tuple[4]),
        latitude: parseFloat(tuple[5]),
        longitude: parseFloat(tuple[6]),
        url: tuple[7] ? unescapeSqlString(tuple[7]) : null,
      });
    }
  }
  return out;
};
