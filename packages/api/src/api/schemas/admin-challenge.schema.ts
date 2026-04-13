import { t } from "elysia";

export const AdminChallengeEntrySchema = t.Object({
  id: t.String(),
  name: t.String(),
  slug: t.String(),
  country: t.String(),
  emoji: t.Nullable(t.String()),
  imageUrl: t.Nullable(t.String()),
  isPublic: t.Boolean(),
  isOfficial: t.Boolean(),
  creatorName: t.Nullable(t.String()),
  totalMountains: t.Number(),
  createdAt: t.Date(),
});

export const AdminChallengesResponseSchema = t.Object({
  items: t.Array(AdminChallengeEntrySchema),
  page: t.Number(),
  pageSize: t.Number(),
  total: t.Number(),
  totalPages: t.Number(),
});

export const AdminChallengeDetailSchema = t.Object({
  id: t.String(),
  name: t.String(),
  slug: t.String(),
  country: t.String(),
  description: t.Nullable(t.String()),
  emoji: t.Nullable(t.String()),
  imageUrl: t.Nullable(t.String()),
  webUrl: t.Nullable(t.String()),
  isPublic: t.Boolean(),
  isOfficial: t.Boolean(),
  creatorName: t.Nullable(t.String()),
  createdAt: t.Date(),
});

export const AdminChallengeUpdateBodySchema = t.Object({
  name: t.Optional(t.String({ minLength: 1, maxLength: 30 })),
  country: t.Optional(t.String({ minLength: 1 })),
  description: t.Optional(t.Nullable(t.String())),
  emoji: t.Optional(t.Nullable(t.String())),
  imageUrl: t.Optional(t.Nullable(t.String())),
  webUrl: t.Optional(t.Nullable(t.String())),
  isPublic: t.Optional(t.Boolean()),
});

export const AdminChallengeMountainSchema = t.Object({
  id: t.String(),
  name: t.String(),
  slug: t.String(),
  location: t.String(),
  height: t.String(),
  imageUrl: t.Nullable(t.String()),
  essential: t.Boolean(),
  isOfficial: t.Boolean(),
  creatorName: t.Nullable(t.String()),
});

export const AdminChallengeMountainsResponseSchema = t.Array(
  AdminChallengeMountainSchema,
);
