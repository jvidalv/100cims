import { t } from "elysia";

export const AdminMountainEntrySchema = t.Object({
  id: t.String(),
  name: t.String(),
  slug: t.String(),
  location: t.String(),
  essential: t.Boolean(),
  height: t.String(),
  imageUrl: t.Nullable(t.String()),
  isOfficial: t.Boolean(),
  creatorName: t.Nullable(t.String()),
  createdAt: t.Date(),
});

export const AdminMountainsResponseSchema = t.Object({
  items: t.Array(AdminMountainEntrySchema),
  page: t.Number(),
  pageSize: t.Number(),
  total: t.Number(),
  totalPages: t.Number(),
});

export const AdminMountainDetailSchema = t.Object({
  id: t.String(),
  name: t.String(),
  slug: t.String(),
  location: t.String(),
  essential: t.Boolean(),
  height: t.String(),
  latitude: t.String(),
  longitude: t.String(),
  url: t.Nullable(t.String()),
  imageUrl: t.Nullable(t.String()),
  isOfficial: t.Boolean(),
  creatorName: t.Nullable(t.String()),
  createdAt: t.Date(),
});

export const AdminMountainUpdateBodySchema = t.Object({
  name: t.Optional(t.String({ minLength: 1 })),
  location: t.Optional(t.String({ minLength: 1 })),
  essential: t.Optional(t.Boolean()),
  height: t.Optional(t.String()),
  latitude: t.Optional(t.String()),
  longitude: t.Optional(t.String()),
  url: t.Optional(t.Nullable(t.String())),
  imageUrl: t.Optional(t.Nullable(t.String())),
});

export const AdminMountainChallengeSchema = t.Object({
  id: t.String(),
  name: t.String(),
  slug: t.String(),
  imageUrl: t.Nullable(t.String()),
  emoji: t.Nullable(t.String()),
  isPublic: t.Boolean(),
  isOfficial: t.Boolean(),
  creatorName: t.Nullable(t.String()),
});

export const AdminMountainChallengesResponseSchema = t.Array(
  AdminMountainChallengeSchema,
);
