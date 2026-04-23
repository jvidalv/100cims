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
  // Viewer's existing rating on this mountain. All null if they haven't
  // rated yet. Keyed on (mountainId, viewer.id). Used by the edit form to
  // pre-fill the viewer's (== summit author's, since only authors edit)
  // rating. Scale semantics: see mountainRatingTable in db/schema.ts.
  viewerFamilyFriendly: t.Nullable(t.Number()),
  viewerDogFriendly: t.Nullable(t.Number()),
  viewerDifficulty: t.Nullable(t.Number()),
  // Summit author's rating on this mountain. Public — shown on the summit
  // detail page so anyone can see what the summiter thought. Keyed on
  // (mountainId, summit.userId).
  authorFamilyFriendly: t.Nullable(t.Number()),
  authorDogFriendly: t.Nullable(t.Number()),
  authorDifficulty: t.Nullable(t.Number()),
});
