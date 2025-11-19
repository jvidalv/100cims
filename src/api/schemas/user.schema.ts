import { t } from "elysia";

/**
 * Schema for user object returned from store/auth
 */
export const UserSchema = t.Object({
  id: t.String(),
  email: t.String(),
  firstName: t.Nullable(t.String()),
  lastName: t.Nullable(t.String()),
  imageUrl: t.Nullable(t.String()),
  town: t.Nullable(t.String()),
  visibleOnHiscores: t.Boolean(),
  visibleOnPeopleSearch: t.Boolean(),
  locale: t.Nullable(t.String()),
  username: t.Nullable(t.String()),
  createdAt: t.Date(),
});

/**
 * Schema for basic user info (used in search results)
 */
export const BasicUserSchema = t.Object({
  id: t.String(),
  firstName: t.Nullable(t.String()),
  lastName: t.Nullable(t.String()),
  imageUrl: t.Nullable(t.String()),
});

/**
 * Schema for array of basic users
 */
export const BasicUsersArraySchema = t.Array(BasicUserSchema);

/**
 * Schema for a single summit in user's summit list
 */
export const UserSummitSchema = t.Object({
  summitId: t.String(),
  summitedAt: t.String(),
  summitedValidated: t.Boolean(),
  mountainName: t.String(),
  mountainSlug: t.String(),
  mountainImageUrl: t.Nullable(t.String()),
  mountainHeight: t.String(),
  mountainEssential: t.Boolean(),
  score: t.Number(),
});

/**
 * Schema for user summits response with stats
 */
export const UserSummitsResponseSchema = t.Object({
  score: t.Number(),
  uniquePeaksCount: t.Number(),
  essentialPeaksCount: t.Number(),
  summits: t.Array(UserSummitSchema),
});

/**
 * Schema for a participant in a public summit
 */
export const ParticipantSchema = t.Object({
  userId: t.String(),
  firstName: t.Nullable(t.String()),
  lastName: t.Nullable(t.String()),
  imageUrl: t.Nullable(t.String()),
});

/**
 * Schema for a public summit with participants
 */
export const PublicSummitSchema = t.Object({
  summitId: t.String(),
  summitedAt: t.String(),
  summitedValidated: t.Boolean(),
  summitedImageUrl: t.String(),
  mountainName: t.String(),
  mountainSlug: t.String(),
  mountainImageUrl: t.Nullable(t.String()),
  mountainHeight: t.String(),
  mountainEssential: t.Boolean(),
  participants: t.Array(ParticipantSchema),
});

/**
 * Schema for array of public summits
 */
export const PublicSummitsArraySchema = t.Array(PublicSummitSchema);

/**
 * Schema for shared user with score
 */
export const SharedUserSchema = t.Object({
  userId: t.String(),
  firstName: t.Nullable(t.String()),
  lastName: t.Nullable(t.String()),
  imageUrl: t.Nullable(t.String()),
  score: t.Number(),
});

/**
 * Schema for user profile response
 */
export const UserProfileResponseSchema = t.Object({
  firstSummitDate: t.Nullable(t.String()),
  lastSummitDate: t.Nullable(t.String()),
  score: t.Number(),
  sharedUsers: t.Array(SharedUserSchema),
});
