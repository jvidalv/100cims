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
  totalUsers: t.String(),
  peakImageUrl: t.Nullable(t.String()),
  // Mean lat/lng of the challenge's mountains, used by the mobile "Closer"
  // sort. Both null when the challenge has no linked mountains. Serialised
  // as numeric strings (same as mountain.latitude / mountain.longitude).
  centroidLatitude: t.Nullable(t.String()),
  centroidLongitude: t.Nullable(t.String()),
});

/**
 * Schema for array of challenges
 */
export const ChallengesArraySchema = t.Array(ChallengeWithCountsSchema);

/**
 * Schema for active challenge response
 */
export const ActiveChallengeSchema = t.Object({
  id: t.String(),
  name: t.String(),
  slug: t.String(),
  country: t.String(),
  totalMountains: t.String(),
  totalEssentialMountains: t.String(),
  isOfficial: t.Boolean(),
});

/**
 * Schema for mountain in public challenge detail
 */
export const PublicChallengeMountainSchema = t.Object({
  id: t.String(),
  name: t.String(),
  slug: t.String(),
  location: t.String(),
  height: t.String(),
  imageUrl: t.Nullable(t.String()),
  essential: t.Boolean(),
});

/**
 * Schema for user in public challenge detail
 */
export const PublicChallengeUserSchema = t.Object({
  id: t.String(),
  firstName: t.Nullable(t.String()),
  lastName: t.Nullable(t.String()),
  imageUrl: t.Nullable(t.String()),
  summitCount: t.Number(),
});

/**
 * Schema for the viewer's progress in a single challenge — drives the
 * "Your stats" section on the challenge detail page.
 */
export const ChallengeMyProgressSchema = t.Object({
  challengeId: t.String(),
  totalMountains: t.Number(),
  totalEssentialMountains: t.Number(),
  summitedCount: t.Number(),
  summitedEssentialCount: t.Number(),
});

/**
 * Schema for public challenge detail response
 */
export const PublicChallengeDetailSchema = t.Object({
  id: t.String(),
  name: t.String(),
  slug: t.String(),
  country: t.String(),
  description: t.Nullable(t.String()),
  emoji: t.Nullable(t.String()),
  imageUrl: t.Nullable(t.String()),
  isOfficial: t.Boolean(),
  isPublic: t.Boolean(),
  totalMountains: t.Number(),
  totalEssentialMountains: t.Number(),
  totalUsers: t.Number(),
  mountains: t.Array(PublicChallengeMountainSchema),
  users: t.Array(PublicChallengeUserSchema),
});
