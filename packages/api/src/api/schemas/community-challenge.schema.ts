import { t } from "elysia";

/**
 * Schema for an inline mountain (created with a challenge)
 */
export const InlineMountainSchema = t.Object({
  name: t.String({ minLength: 1 }),
  location: t.String({ minLength: 1 }),
  height: t.Number({ minimum: 0, maximum: 10000 }),
  latitude: t.Number({ minimum: -90, maximum: 90 }),
  longitude: t.Number({ minimum: -180, maximum: 180 }),
  essential: t.Optional(t.Boolean()),
  image: t.String({ minLength: 1 }), // base64 required
});

/**
 * Schema for creating a community challenge
 */
export const CreateCommunityChallengeBody = t.Object({
  name: t.String({ minLength: 1, maxLength: 30 }),
  description: t.Optional(t.String()),
  country: t.String({ minLength: 1 }),
  isPublic: t.Optional(t.Boolean()),
  image: t.Optional(t.String()), // base64 encoded image
  emoji: t.Optional(t.String()),
  mountainIds: t.Optional(t.Array(t.String())), // existing mountains to link
  newMountains: t.Optional(t.Array(InlineMountainSchema)), // mountains to create inline
});

/**
 * Schema for updating a community challenge
 */
export const UpdateCommunityChallengeBody = t.Object({
  id: t.String(),
  name: t.Optional(t.String({ minLength: 1, maxLength: 30 })),
  description: t.Optional(t.String()),
  country: t.Optional(t.String({ minLength: 1 })),
  isPublic: t.Optional(t.Boolean()),
  image: t.Optional(t.String()), // base64 encoded image
  emoji: t.Optional(t.String()),
  mountainIds: t.Optional(t.Array(t.String())), // array of mountain UUIDs to set
  newMountains: t.Optional(t.Array(InlineMountainSchema)), // mountains to create inline
});

/**
 * Schema for a community challenge response
 */
export const CommunityChallengeSchema = t.Object({
  id: t.String(),
  name: t.String(),
  slug: t.String(),
  description: t.Union([t.String(), t.Null()]),
  country: t.String(),
  imageUrl: t.Union([t.String(), t.Null()]),
  emoji: t.Union([t.String(), t.Null()]),
  isPublic: t.Boolean(),
  creatorId: t.Union([t.String(), t.Null()]),
  totalMountains: t.String(),
  totalUsers: t.String(),
  createdAt: t.String(),
});

/**
 * Schema for array of community challenges
 */
export const CommunityChallengesArraySchema = t.Array(CommunityChallengeSchema);

/**
 * Schema for community challenge detail with mountains
 */
export const CommunityChallengeDetailSchema = t.Object({
  id: t.String(),
  name: t.String(),
  slug: t.String(),
  description: t.Union([t.String(), t.Null()]),
  country: t.String(),
  imageUrl: t.Union([t.String(), t.Null()]),
  emoji: t.Union([t.String(), t.Null()]),
  isPublic: t.Boolean(),
  creatorId: t.Union([t.String(), t.Null()]),
  createdAt: t.String(),
  mountains: t.Array(
    t.Object({
      id: t.String(),
      name: t.String(),
      slug: t.String(),
      location: t.String(),
      height: t.String(),
      latitude: t.String(),
      longitude: t.String(),
      imageUrl: t.Union([t.String(), t.Null()]),
      essential: t.Boolean(),
    }),
  ),
});

/**
 * Query params for listing community challenges
 */
export const ListCommunityChallengesQuery = t.Object({
  filter: t.Optional(t.Union([t.Literal("mine"), t.Literal("public")])),
});
