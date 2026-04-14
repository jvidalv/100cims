import type { ChallengeContent, ChallengeLocale } from "./schema";

import hundredCims from "./100-cims.json";
import hundredCimsUsa from "./100-cims-usa.json";
import altosMadrilenos from "./altos-madrilenos.json";
import aragon from "./aragon.json";
import corsicaGr20 from "./corsica-gr-20.json";
import cumbresAstures from "./cumbres-astures.json";
import cumbresDelLevante from "./cumbres-del-levante.json";
import frenchAlps from "./french-alps.json";
import highlandTerraAlta from "./highland-terra-alta.json";
import islasCanarias from "./islas-canarias.json";
import montesGallegos from "./montes-gallegos.json";
import repteDelGirones from "./repte-del-girones.json";
import topSpain from "./top-spain.json";

const VALID_LOCALES: readonly ChallengeLocale[] = ["ca", "es", "en"];

const isLocale = (value: string): value is ChallengeLocale =>
  (VALID_LOCALES as readonly string[]).includes(value);

interface RawContent {
  locale: string;
  title: string;
  shortName: string;
  description: string;
  heroTagline: string;
  heroImageUrl: string;
  whatIsTitle: string;
  whatIsParagraphs: string[];
  faqs: { q: string; a: string }[];
}

const narrow = (raw: RawContent, source: string): ChallengeContent => {
  if (!isLocale(raw.locale)) {
    throw new Error(
      `[challenges/content] ${source}: invalid locale "${raw.locale}"`,
    );
  }
  return { ...raw, locale: raw.locale };
};

export const CHALLENGE_CONTENT = {
  "100-cims": narrow(hundredCims, "100-cims"),
  "100-cims-usa": narrow(hundredCimsUsa, "100-cims-usa"),
  "altos-madrilenos": narrow(altosMadrilenos, "altos-madrilenos"),
  aragon: narrow(aragon, "aragon"),
  "corsica-gr-20": narrow(corsicaGr20, "corsica-gr-20"),
  "cumbres-astures": narrow(cumbresAstures, "cumbres-astures"),
  "cumbres-del-levante": narrow(cumbresDelLevante, "cumbres-del-levante"),
  "french-alps": narrow(frenchAlps, "french-alps"),
  "highland-terra-alta": narrow(highlandTerraAlta, "highland-terra-alta"),
  "islas-canarias": narrow(islasCanarias, "islas-canarias"),
  "montes-gallegos": narrow(montesGallegos, "montes-gallegos"),
  "repte-del-girones": narrow(repteDelGirones, "repte-del-girones"),
  "top-spain": narrow(topSpain, "top-spain"),
} satisfies Record<string, ChallengeContent>;

export type OfficialSlug = keyof typeof CHALLENGE_CONTENT;

export const isOfficialSlug = (value: string): value is OfficialSlug =>
  value in CHALLENGE_CONTENT;
