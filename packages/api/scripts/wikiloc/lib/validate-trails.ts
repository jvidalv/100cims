import { z } from "zod";

import type { GeminiTextClient } from "./gemini";
import type { TrailDetail } from "./types";

// Gemini gets ALL candidates for a mountain in one prompt and returns the set
// of externalIds it considers valid + distinct. We pass it the raw title and
// description so it can rule out:
//   - Routes that don't actually summit the target mountain (a search false
//     positive — Wikiloc's text search can match a passing mention).
//   - Wrong country / wrong mountain with similar name.
//   - Near-duplicate routes (same start point + same direction + similar
//     distance) — for those we keep the highest-rated one.
//
// The model can return as few as 1 entry; that's fine. Below 1 means "nothing
// found that we can vouch for", which the caller treats as a no-results case.

const SYSTEM_PROMPT = `You are filtering scraped hiking-trail candidates for
a specific mountain.

Inputs:
- A target mountain (name, location, height).
- A list of up to 5 candidate routes, each with the raw Wikiloc title, the
  author's description, distance, elevation gain, and trail type.

For EACH candidate decide whether to KEEP or REJECT it, applying these rules:

1. REJECT if the route does not actually summit the target mountain. The raw
   title or description usually says which peak — match against the target
   name (allowing language variants and accented spellings, e.g. "Pic" vs
   "Pico", "Pica d'Estats" vs "Pica de Estados"). A route that just passes
   nearby or names a different peak should be rejected.
2. REJECT if the route is in the wrong country/region. Use the target's
   "location" field as the canonical region.
3. When two candidates are NEAR-DUPLICATES (same trailhead, same direction,
   ±15% distance), keep ONE — prefer the one with the higher TrailRank if
   you can infer it from the description, otherwise the longer/clearer
   description.
4. Be lenient: if you cannot positively confirm the route is wrong, KEEP it.
   Most candidates from Wikiloc's text search are legitimate.

Output ONLY valid JSON with this shape:
{
  "keep": [
    { "externalId": "<id>", "reason": "<short reason>" },
    ...
  ]
}

The order of "keep" should be the order to show them to users — most
distinctive / highest-quality first. Include 1 to 5 entries. If you are
unable to vouch for any candidate, return { "keep": [] }.

No prose, no markdown fences, just JSON.`;

const KeepEntrySchema = z.object({
  externalId: z.string(),
  reason: z.string(),
});

const ResponseSchema = z.object({
  keep: z.array(KeepEntrySchema),
});

type CandidateBrief = {
  externalId: string;
  titleRaw: string;
  description: string | null;
  distanceKm: number | null;
  elevationGainM: number | null;
  trailType: string | null;
};

const briefForLlm = (t: TrailDetail): CandidateBrief => ({
  externalId: t.externalId,
  titleRaw: t.titleRaw,
  description: t.descriptionRaw ? t.descriptionRaw.slice(0, 1500) : null,
  distanceKm:
    t.distanceMeters !== null ? Math.round(t.distanceMeters / 100) / 10 : null,
  elevationGainM: t.elevationGainMeters,
  trailType: t.trailType,
});

export type ValidationOutcome = {
  kept: TrailDetail[];
  rejected: { trail: TrailDetail; reason: string }[];
};

export const validateTrails = async (params: {
  client: GeminiTextClient;
  mountainName: string;
  mountainLocation: string;
  mountainHeight: number | null;
  trails: TrailDetail[];
}): Promise<ValidationOutcome> => {
  if (params.trails.length === 0) return { kept: [], rejected: [] };

  const userPayload = {
    target: {
      name: params.mountainName,
      location: params.mountainLocation,
      heightMeters: params.mountainHeight,
    },
    candidates: params.trails.map(briefForLlm),
  };

  const result = await params.client.generateJson({
    system: SYSTEM_PROMPT,
    user: JSON.stringify(userPayload, null, 2),
  });

  const parsed = ResponseSchema.safeParse(result);
  if (!parsed.success) {
    throw new Error(
      `Gemini validation response failed shape validation: ${parsed.error.message}; ` +
        `got: ${JSON.stringify(result).slice(0, 500)}`,
    );
  }

  const keepIds = new Map(
    parsed.data.keep.map((entry) => [entry.externalId, entry.reason]),
  );
  // Preserve the order Gemini returned (it's the rank order).
  const orderedKeptIds = parsed.data.keep.map((entry) => entry.externalId);
  const trailById = new Map(params.trails.map((t) => [t.externalId, t]));

  const kept: TrailDetail[] = [];
  for (const id of orderedKeptIds) {
    const trail = trailById.get(id);
    if (trail) kept.push(trail);
  }
  const rejected: { trail: TrailDetail; reason: string }[] = [];
  for (const trail of params.trails) {
    if (!keepIds.has(trail.externalId)) {
      rejected.push({ trail, reason: "not in Gemini keep-list" });
    }
  }
  return { kept, rejected };
};
