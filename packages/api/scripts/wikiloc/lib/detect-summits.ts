import { z } from "zod";

import type { GeminiTextClient } from "./gemini";
import type { TrailDetail } from "./types";

// Given the raw author title + description for each trail on a mountain page,
// figure out WHICH mountains in our catalog that route actually summits.
//
// The catalog is ~1300 peaks — too many to put in a single prompt. The caller
// pre-filters to a coordinate-based candidate set (mountains within ~20km of
// the trail's starting GPS point) so the prompt only sees plausibly-relevant
// candidates plus the originating mountain.

const SYSTEM_PROMPT = `You are reviewing scraped hiking-trail descriptions to
determine which catalogued mountains each route SUMMITS.

For EACH input trail decide which mountain slugs from the candidate list the
route actually reaches the summit of. Apply STRICT matching:

1. KEEP a slug only if the title or description states the route reaches that
   mountain's PEAK. Phrases like "summit", "top", "we reached", "cim", "cima",
   "subimos a", "pujada a", or "ascent of" qualify.
2. REJECT mountains the route only passes near, views from afar, or shares a
   trailhead with. A route "starting at Refugi Vallferrera" does NOT summit
   Vallferrera (which isn't a peak anyway, but you get the idea).
3. REJECT mountains in different regions even if the name matches. Cross-check
   the description's place names against the candidate's location string.
4. The originating mountain (the one we searched Wikiloc for) is almost
   always summited — keep it unless the description clearly contradicts.
5. Multi-peak routes are common (e.g. "Pica d'Estats + Verdaguer + Montcalm"
   reaches three peaks). Output all of them.

OUTPUT FORMAT — return ONLY valid JSON:
{
  "trails": [
    {
      "externalId": "<id>",
      "summits": ["<mountain-slug>", "<another-slug>", ...]
    },
    ...
  ]
}

One object per input trail, same order. "summits" is the list of slugs (the
originating mountain first, others after). Empty array means the route
doesn't summit any catalogued mountain (rare).

No prose, no markdown fences.`;

const TrailEntrySchema = z.object({
  externalId: z.string(),
  summits: z.array(z.string()),
});

const ResponseSchema = z.object({
  trails: z.array(TrailEntrySchema),
});

type TrailBrief = {
  externalId: string;
  titleRaw: string;
  description: string | null;
};

const briefForLlm = (t: TrailDetail): TrailBrief => ({
  externalId: t.externalId,
  titleRaw: t.titleRaw,
  description: t.descriptionRaw ? t.descriptionRaw.slice(0, 1500) : null,
});

type Candidate = {
  slug: string;
  name: string;
  location: string;
  heightMeters: number;
};

export const detectSummits = async (params: {
  client: GeminiTextClient;
  originatingSlug: string;
  candidates: Candidate[];
  trails: TrailDetail[];
}): Promise<Map<string, string[]>> => {
  if (params.trails.length === 0) return new Map();

  const userPayload = {
    originatingMountainSlug: params.originatingSlug,
    candidates: params.candidates,
    trails: params.trails.map(briefForLlm),
  };

  const result = await params.client.generateJson({
    system: SYSTEM_PROMPT,
    user: JSON.stringify(userPayload, null, 2),
  });

  const parsed = ResponseSchema.safeParse(result);
  if (!parsed.success) {
    throw new Error(
      `Gemini summit-detection response failed shape: ${parsed.error.message}; ` +
        `got: ${JSON.stringify(result).slice(0, 500)}`,
    );
  }

  // Filter Gemini output to slugs that are actually in our candidate set.
  // Catches hallucinated slugs ("pica-de-estats" with the typo) and slugs the
  // model invented for peaks not in our catalog. We trust the originating
  // slug even if Gemini drops it (rare; usually means the trail title was
  // about a sibling peak).
  const candidateSlugs = new Set(params.candidates.map((c) => c.slug));
  const out = new Map<string, string[]>();
  for (const entry of parsed.data.trails) {
    const filtered = entry.summits.filter((s) => candidateSlugs.has(s));
    // Ensure originating slug appears first if Gemini included it.
    const idx = filtered.indexOf(params.originatingSlug);
    if (idx > 0) {
      filtered.splice(idx, 1);
      filtered.unshift(params.originatingSlug);
    }
    out.set(entry.externalId, filtered);
  }
  return out;
};
