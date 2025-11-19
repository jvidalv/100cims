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
});

/**
 * Schema for array of mountains
 */
export const MountainsArraySchema = t.Array(MountainSchema);

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
