import { t } from "elysia";

export const AdminUserEntrySchema = t.Object({
  id: t.String(),
  firstName: t.Nullable(t.String()),
  lastName: t.Nullable(t.String()),
  username: t.String(),
  email: t.String(),
  imageUrl: t.Nullable(t.String()),
  country: t.Nullable(t.String()),
  platform: t.Nullable(t.String()),
  appVersion: t.Nullable(t.String()),
  createdAt: t.Date(),
  admin: t.Boolean(),
  activeChallengeId: t.Nullable(t.String()),
  activeChallengeName: t.Nullable(t.String()),
});

export const AdminUsersResponseSchema = t.Object({
  items: t.Array(AdminUserEntrySchema),
  page: t.Number(),
  pageSize: t.Number(),
  total: t.Number(),
  totalPages: t.Number(),
  facets: t.Object({
    countries: t.Array(t.String()),
    platforms: t.Array(t.String()),
    versions: t.Array(t.String()),
  }),
});

export const AdminUserDetailSchema = t.Object({
  id: t.String(),
  email: t.String(),
  username: t.String(),
  firstName: t.Nullable(t.String()),
  lastName: t.Nullable(t.String()),
  imageUrl: t.Nullable(t.String()),
  town: t.Nullable(t.String()),
  country: t.Nullable(t.String()),
  platform: t.Nullable(t.String()),
  appVersion: t.Nullable(t.String()),
  locale: t.Nullable(t.String()),
  visibleOnHiscores: t.Boolean(),
  visibleOnPeopleSearch: t.Boolean(),
  admin: t.Boolean(),
  activeChallengeId: t.Nullable(t.String()),
  activeChallengeName: t.Nullable(t.String()),
  createdAt: t.Date(),
});

export const AdminUserUpdateBodySchema = t.Object({
  firstName: t.Optional(t.Nullable(t.String())),
  lastName: t.Optional(t.Nullable(t.String())),
  username: t.Optional(t.String()),
  town: t.Optional(t.Nullable(t.String())),
  country: t.Optional(t.Nullable(t.String())),
  locale: t.Optional(t.Nullable(t.String())),
  visibleOnHiscores: t.Optional(t.Boolean()),
  visibleOnPeopleSearch: t.Optional(t.Boolean()),
  admin: t.Optional(t.Boolean()),
});

export const AdminSummitEntrySchema = t.Object({
  summitId: t.String(),
  summitedAt: t.String(),
  validated: t.Boolean(),
  imageUrl: t.String(),
  mountainId: t.String(),
  mountainName: t.String(),
  mountainSlug: t.String(),
  mountainHeight: t.String(),
  mountainEssential: t.Boolean(),
});

export const AdminSummitsResponseSchema = t.Object({
  items: t.Array(AdminSummitEntrySchema),
  page: t.Number(),
  pageSize: t.Number(),
  total: t.Number(),
  totalPages: t.Number(),
});
