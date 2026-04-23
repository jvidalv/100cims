import { t } from "elysia";

/**
 * Schema for a single mountain
 */
export const MountainSchema = t.Object({
  id: t.String(),
  name: t.String(),
  slug: t.String(),
  location: t.String(),
  essential: t.Boolean(),
  height: t.String(),
  latitude: t.String(),
  longitude: t.String(),
  imageUrl: t.Nullable(t.String()),
  avgFamilyFriendly: t.Optional(t.Nullable(t.Number())),
  familyRatingCount: t.Optional(t.Number()),
  avgDogFriendly: t.Optional(t.Nullable(t.Number())),
  dogRatingCount: t.Optional(t.Number()),
  avgDifficulty: t.Optional(t.Nullable(t.Number())),
  difficultyRatingCount: t.Optional(t.Number()),
});

/**
 * Schema for array of mountains
 */
export const MountainsArraySchema = t.Array(MountainSchema);

/**
 * Schema for creating a custom mountain
 */
export const CreateMountainBody = t.Object({
  name: t.String({ minLength: 1 }),
  location: t.String({ minLength: 1 }),
  height: t.Number({ minimum: 0, maximum: 10000 }),
  latitude: t.Number({ minimum: -90, maximum: 90 }),
  longitude: t.Number({ minimum: -180, maximum: 180 }),
  essential: t.Optional(t.Boolean()),
  image: t.String({ minLength: 1 }), // base64 encoded image, required
});

/**
 * Schema for created mountain response
 */
export const CreatedMountainSchema = t.Object({
  id: t.String(),
  name: t.String(),
  slug: t.String(),
  location: t.String(),
  height: t.String(),
  latitude: t.String(),
  longitude: t.String(),
  imageUrl: t.Union([t.String(), t.Null()]),
  essential: t.Boolean(),
  creatorId: t.Union([t.String(), t.Null()]),
});

/**
 * Schema for updating a mountain
 */
export const UpdateMountainBody = t.Object({
  id: t.String(),
  name: t.Optional(t.String({ minLength: 1 })),
  location: t.Optional(t.String({ minLength: 1 })),
  height: t.Optional(t.Number({ minimum: 0, maximum: 10000 })),
  latitude: t.Optional(t.Number({ minimum: -90, maximum: 90 })),
  longitude: t.Optional(t.Number({ minimum: -180, maximum: 180 })),
  essential: t.Optional(t.Boolean()),
  image: t.Optional(t.String({ minLength: 1 })), // base64 encoded image
});

/**
 * Schema for mountain in my mountains list (includes challenge count)
 */
export const MyMountainSchema = t.Object({
  id: t.String(),
  name: t.String(),
  slug: t.String(),
  location: t.String(),
  height: t.String(),
  latitude: t.String(),
  longitude: t.String(),
  imageUrl: t.Union([t.String(), t.Null()]),
  essential: t.Boolean(),
  challengeCount: t.Number(),
});

/**
 * Schema for array of my mountains
 */
export const MyMountainsArraySchema = t.Array(MyMountainSchema);

/**
 * Schema for a user in a summit
 */
export const SummitUserSchema = t.Object({
  id: t.String(),
  firstName: t.Nullable(t.String()),
  lastName: t.Nullable(t.String()),
  imageUrl: t.Nullable(t.String()),
});

/**
 * Schema for a summit with users
 */
export const SummitWithUsersSchema = t.Object({
  summitId: t.String(),
  mountainId: t.String(),
  mountainSlug: t.String(),
  summitImageUrl: t.String(),
  summitedAt: t.String(),
  createdAt: t.Date(),
  mountainName: t.String(),
  users: t.Array(SummitUserSchema),
});

/**
 * Schema for array of summits with users
 */
export const SummitsArraySchema = t.Array(SummitWithUsersSchema);
