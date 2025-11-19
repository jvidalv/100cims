import { t } from "elysia";

/**
 * Schema for a single challenge with mountain counts
 */
export const ChallengeWithCountsSchema = t.Object({
  id: t.String(),
  name: t.String(),
  slug: t.String(),
  country: t.String(),
  totalMountains: t.String(),
  totalEssentialMountains: t.String(),
});

/**
 * Schema for array of challenges
 */
export const ChallengesArraySchema = t.Array(ChallengeWithCountsSchema);
