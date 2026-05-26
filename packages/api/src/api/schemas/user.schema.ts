import { t } from "elysia";

/**
 * Public-facing user shape. Used wherever one user reads another user's
 * profile (e.g. `/api/public/user/one`). Private fields like phoneNumber
 * must never be added here — extend `MeSchema` instead.
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
  admin: t.Optional(t.Boolean()),
  locale: t.Nullable(t.String()),
  username: t.Nullable(t.String()),
  activeChallengeId: t.Nullable(t.String()),
  unlockables: t.Optional(t.Array(t.String())),
  createdAt: t.Date(),
});

/**
 * Owner-only user shape returned by `/me` endpoints (protected + admin).
 * Superset of `UserSchema` with fields the user can see about themselves
 * but no one else can see about them.
 */
export const MeSchema = t.Intersect([
  UserSchema,
  t.Object({
    phoneNumber: t.Nullable(t.String()),
  }),
]);

/**
 * Schema for basic user info (used in search results)
 */
export const BasicUserSchema = t.Object({
  id: t.String(),
  firstName: t.Nullable(t.String()),
  lastName: t.Nullable(t.String()),
  imageUrl: t.Nullable(t.String()),
  isPerson: t.Optional(t.Boolean()),
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
 * Schema for paginated all-challenges user summits response
 */
export const UserSummitsAllResponseSchema = t.Object({
  items: t.Array(UserSummitSchema),
  aggregates: t.Object({
    score: t.Number(),
    uniquePeaksCount: t.Number(),
    essentialPeaksCount: t.Number(),
    totalSummits: t.Number(),
  }),
  pagination: t.Object({
    page: t.Number(),
    pageSize: t.Number(),
    totalItems: t.Number(),
    totalPages: t.Number(),
    hasMore: t.Boolean(),
  }),
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
 * Schema for paginated public summits of any user. Used by
 * `/api/public/user/summits/all` — the non-paginated `/summits` stays in
 * place so old mobile clients keep working.
 */
export const PublicUserSummitsAllResponseSchema = t.Object({
  items: t.Array(PublicSummitSchema),
  pagination: t.Object({
    page: t.Number(),
    pageSize: t.Number(),
    totalItems: t.Number(),
    totalPages: t.Number(),
    hasMore: t.Boolean(),
  }),
});

/**
 * Schema for shared user with score
 */
export const SharedUserSchema = t.Object({
  userId: t.String(),
  firstName: t.Nullable(t.String()),
  lastName: t.Nullable(t.String()),
  imageUrl: t.Nullable(t.String()),
  score: t.Number(),
  summitsTogetherCount: t.Number(),
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

/**
 * Schema for a challenge the user is part of
 */
export const UserChallengeSchema = t.Object({
  id: t.String(),
  name: t.String(),
  slug: t.String(),
  country: t.String(),
  emoji: t.Nullable(t.String()),
  imageUrl: t.Nullable(t.String()),
  isOfficial: t.Boolean(),
  summitCount: t.Number(),
});

/**
 * Schema for array of user challenges
 */
export const UserChallengesArraySchema = t.Array(UserChallengeSchema);
