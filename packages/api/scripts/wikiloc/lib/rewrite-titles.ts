import { z } from "zod";

import type { GeminiTextClient } from "./gemini";
import type { LocalizedString, TrailDetail } from "./types";

// Gemini gets ALL the trails for a mountain in one prompt so it can produce
// distinct titles that highlight what makes each route different from the
// others. Five hikes up the same peak are often near-identical; the title
// should answer "why would I pick THIS one over the others".

const SYSTEM_PROMPT = `You are renaming hiking routes for a mountain app. The
user gives you a list of routes that all summit the same mountain. Your job:
for EACH route, produce a short, human title in three languages (English,
Catalan, Spanish) that captures what makes that specific route distinct from
its siblings — the approach side, the start point, whether it includes nearby
peaks, the difficulty character, or the length.

RULES:
- 3 to 7 words per title. No trailing punctuation.
- Do NOT lead with the mountain name. The mountain name is already shown in
  the screen header — repeating it in every route card is noise. Instead lead
  with the distinguishing feature: the approach, the start point, the loop
  character, or the route shape.
  GOOD: "Long loop via La Molinassa", "Approach from Artigue parking",
  "Pinet refuge stage with Verdaguer".
  BAD:  "Pica d'Estats: long loop via La Molinassa".
- Vocabulary, per language:
  · For a loop / circular trail (start ≈ end):
      en: "loop" or "circular"
      ca: "circular" (NEVER "bucle")
      es: "circular" (NEVER "bucle")
  · For out-and-back: en "out and back", ca "anada i tornada", es "ida y vuelta".
  · For one-way: en "one way", ca "un sol sentit", es "un solo sentido".
- Use info from the raw title, the description, and the stats (distance,
  elevation gain, trail type loop/one-way, difficulty). When the description
  is in Catalan or Spanish, translate the key landmarks (e.g. "Refugi de
  Pinet" stays the same in en/es as it's a proper noun).
- Avoid source-side jargon like "100 Cims FEEC", "IBP", "HKG", "Stage I/II".
- Each language's titles for the five routes must be MUTUALLY DISTINCT — if
  two routes share the same approach, lean on what else differs (e.g. one
  longer, one adds Verdaguer, one is circular).

OUTPUT FORMAT — return ONLY valid JSON with this exact shape:
{
  "titles": [
    { "externalId": "<id>", "en": "...", "ca": "...", "es": "..." },
    ...
  ]
}
One object per input route, same order. No prose, no markdown, no fences.`;

const TitleEntrySchema = z.object({
  externalId: z.string(),
  en: z.string().min(1),
  ca: z.string().min(1),
  es: z.string().min(1),
});

const ResponseSchema = z.object({
  titles: z.array(TitleEntrySchema),
});

type BriefTrail = {
  externalId: string;
  titleRaw: string;
  description: string | null;
  distanceKm: number | null;
  elevationGainM: number | null;
  trailType: string | null;
  difficulty: string | null;
};

const briefForLlm = (t: TrailDetail): BriefTrail => ({
  externalId: t.externalId,
  titleRaw: t.titleRaw,
  description: t.descriptionRaw ? t.descriptionRaw.slice(0, 1500) : null,
  distanceKm:
    t.distanceMeters !== null ? Math.round(t.distanceMeters / 100) / 10 : null,
  elevationGainM: t.elevationGainMeters,
  trailType: t.trailType,
  difficulty: t.technicalDifficulty,
});

const buildUserPrompt = (mountainName: string, trails: TrailDetail[]): string => {
  const briefs = trails.map(briefForLlm);
  return [
    `Mountain: ${mountainName}`,
    "",
    "Routes to rename (preserve order, one output per input):",
    JSON.stringify(briefs, null, 2),
  ].join("\n");
};

export const rewriteTitles = async (params: {
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
      `Gemini response failed shape validation: ${parsed.error.message}; ` +
        `got: ${JSON.stringify(result).slice(0, 500)}`,
    );
  }
  const out = new Map<string, LocalizedString>();
  for (const entry of parsed.data.titles) {
    out.set(entry.externalId, {
      en: entry.en,
      ca: entry.ca,
      es: entry.es,
    });
  }
  // Sanity-check: every input must have a localized output.
  for (const trail of params.trails) {
    if (!out.has(trail.externalId)) {
      throw new Error(
        `Gemini did not return a title for trail ${trail.externalId}`,
      );
    }
  }
  return out;
};
