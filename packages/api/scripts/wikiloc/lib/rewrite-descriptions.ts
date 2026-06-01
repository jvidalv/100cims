import { z } from "zod";

import type { GeminiTextClient } from "./gemini";
import type { LocalizedString, TrailDetail } from "./types";

// Gemini gets all kept trails for a mountain in one prompt and returns a
// concise summary per trail in en/ca/es. The summary is OUR editorial voice
// — we don't paraphrase the author's prose, we extract the useful facts
// (terrain, key landmarks, warnings, character) and rewrite them.

const SYSTEM_PROMPT = `You are writing concise route summaries for a hiking app.

For EACH trail you receive, write a SHORT description in three languages
(English, Catalan, Spanish) based on:
- The route's raw title.
- The author's description (may be in any language, often mixed).
- The route's stats (distance, elevation gain, trail type, difficulty).

FOCUS: the description must be USEFUL to a hiker DECIDING whether to do
this specific route. Answer these implicit questions:
  - Where does the route start, and how do you get there?
  - What does the terrain feel like (forest, scree, ridge, chains,
    exposure, route-finding)?
  - What's the character of the climb (steady, brutal, mixed)?
  - What summits/landmarks does it pass on the way?
  - What level of hiker is it suitable for?

FORMAT:
- 2 to 4 short paragraphs separated by a single blank line ("\\n\\n").
- Roughly 60 to 100 words per language. Lean. No filler.
- Plain prose. No bullet lists. No headings. No emoji. No "Hiking trail
  in X (Y). Download its GPS track..." boilerplate.
- Translate landmark types ("refugi" / "refugio" / "refuge"; "estany" /
  "lago" / "lake"; "coll" / "collado" / "pass"; "tartera" / "pedrera" /
  "scree slope") but preserve proper nouns ("Refugi Vallferrera").

CONTENT — what to KEEP:
- Trailhead and how to access it (parking, road quality, dirt track).
- Terrain features: scree, chains, exposure, scrambling, water crossings,
  route-finding difficulty, snow risk, marked vs unmarked.
- Major waypoints in order: refuges, lakes, passes, summits.
- Distance and elevation when they meaningfully shape the route (e.g.
  a steep 450m in 1km section).
- The route's character: family-friendly, technical, long approach,
  big-day-out, multi-day, etc.

CONTENT — what to STRIP (these are the noise patterns common in raw
Wikiloc text; never include any of them):
- Liability disclaimers ("Tota l'activitat queda sota la responsabilitat...",
  "Use at your own risk", "L'informació facilitada és mera referència...").
- Author personal commentary ("decidim", "nosaltres hem fet", "amb el
  meu gos", "amb els amics", "amb la furgoneta", "vaig fer fotos").
- Hike sign-offs and salutations ("Salut i muntanya!", "Bon camí!",
  "amunt amunt que fa baixada", group names, attributions to other
  Wikiloc users like "@username").
- Lists of mountains VISIBLE from the summit (panorama descriptions —
  e.g. "des del cim es veuen Aneto, Maladeta, Posets..."). These are
  about the view, not the route.
- Blow-by-blow turn-by-turn directions ("ara a la dreta, ara a
  l'esquerra, en zig-zag..."). Summarise the character of the path
  instead.
- Emoji, asterisks, ★ ratings, IBP/HKG ratings, route-difficulty codes.
- "100 Cims FEEC essencial", "2x100 Cims", or similar challenge tags.
- Generic platitudes ("la natura és bonica", "vistes impressionants").
- Author's choice between alternate routes ("vam decidir anar per la
  dreta perquè..."). State the chosen route's character, not the
  decision process.

CONTENT — what NOT to do:
- DO NOT copy sentences verbatim. Extract the facts; rewrite the prose
  in your own neutral voice.
- DO NOT invent details. If the source doesn't say something, leave it
  out. Better short than fabricated.
- DO NOT use hype words: "breathtaking", "stunning", "epic", "incredible",
  "magical", "must-do". Plain.
- DO NOT reference the author ("the author climbs...", "they decided...").
  Describe the route impersonally.
- Each trail's description must be DISTINCT from siblings on the same
  mountain — lean on what makes THIS route different (start point,
  approach side, additional summits, length, technicality).

OUTPUT FORMAT — return ONLY valid JSON:
{
  "descriptions": [
    {
      "externalId": "<id>",
      "en": "<paragraphs joined by \\n\\n>",
      "ca": "<paragraphs joined by \\n\\n>",
      "es": "<paragraphs joined by \\n\\n>"
    },
    ...
  ]
}

One object per input route, same order. No prose outside the JSON. No
markdown fences. No comments.`;

const DescriptionEntrySchema = z.object({
  externalId: z.string(),
  en: z.string().min(1),
  ca: z.string().min(1),
  es: z.string().min(1),
});

const ResponseSchema = z.object({
  descriptions: z.array(DescriptionEntrySchema),
});

type DescriptionBrief = {
  externalId: string;
  titleRaw: string;
  descriptionRaw: string | null;
  distanceKm: number | null;
  elevationGainM: number | null;
  trailType: string | null;
  difficulty: string | null;
};

const briefForLlm = (t: TrailDetail): DescriptionBrief => ({
  externalId: t.externalId,
  titleRaw: t.titleRaw,
  // Cap source description at 1500 chars — Wikiloc occasionally has very
  // long author descriptions that would balloon the prompt. The first
  // 1500 chars hold the trail-relevant content; the tail is usually
  // disclaimers, the same description in another language, or external
  // links.
  descriptionRaw: t.descriptionRaw ? t.descriptionRaw.slice(0, 1500) : null,
  distanceKm:
    t.distanceMeters !== null ? Math.round(t.distanceMeters / 100) / 10 : null,
  elevationGainM: t.elevationGainMeters,
  trailType: t.trailType,
  difficulty: t.technicalDifficulty,
});

const buildUserPrompt = (
  mountainName: string,
  trails: TrailDetail[],
): string => {
  const briefs = trails.map(briefForLlm);
  return [
    `Mountain: ${mountainName}`,
    "",
    "Routes to summarize (preserve order, one output per input):",
    JSON.stringify(briefs, null, 2),
  ].join("\n");
};

export const rewriteDescriptions = async (params: {
  client: GeminiTextClient;
  mountainName: string;
  trails: TrailDetail[];
}): Promise<Map<string, LocalizedString>> => {
  if (params.trails.length === 0) return new Map();

  const result = await params.client.generateJson({
    system: SYSTEM_PROMPT,
    user: buildUserPrompt(params.mountainName, params.trails),
  });
  const parsed = ResponseSchema.safeParse(result);
  if (!parsed.success) {
    throw new Error(
      `Gemini description response failed shape validation: ${parsed.error.message}; ` +
        `got: ${JSON.stringify(result).slice(0, 500)}`,
    );
  }
  const out = new Map<string, LocalizedString>();
  for (const entry of parsed.data.descriptions) {
    out.set(entry.externalId, {
      en: entry.en,
      ca: entry.ca,
      es: entry.es,
    });
  }
  // Gemini occasionally drops entries (truncation, dedupe, refusal) and the
  // response still passes shape validation. Surface the gap as an error so
  // the caller can decide — silent partial fills cause stale descriptions
  // to ship under the assumption everything got rewritten.
  const missing = params.trails
    .map((t) => t.externalId)
    .filter((id) => !out.has(id));
  if (missing.length > 0) {
    throw new Error(
      `Gemini description response missing ${missing.length} of ${params.trails.length} entries: ${missing.join(", ")}`,
    );
  }
  return out;
};
