import { t } from "elysia";

/**
 * Schema for a user in a summit
 */
export const SummitUserSchema = t.Object({
  userId: t.String(),
  firstName: t.Nullable(t.String()),
  lastName: t.Nullable(t.String()),
  imageUrl: t.Nullable(t.String()),
});

/**
 * Schema for a detailed summit with mountain and users
 */
export const SummitDetailSchema = t.Object({
  summitId: t.String(),
  summitedAt: t.String(),
  summitValidated: t.Boolean(),
  summitImageUrl: t.String(),
  mountainId: t.String(),
  mountainName: t.String(),
  mountainSlug: t.String(),
  mountainLocation: t.String(),
  mountainEssential: t.Boolean(),
  mountainHeight: t.String(),
  mountainLatitude: t.String(),
  mountainLongitude: t.String(),
  mountainImageUrl: t.Nullable(t.String()),
  users: t.Array(SummitUserSchema),
});
