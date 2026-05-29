import { t } from "elysia";

/**
 * Mobile-facing organization detail. Mirrors the admin org detail shape
 * minus internal-only fields (`updatedAt`). Members are the flat list of
 * users belonging to the org — no role distinction at this level (the
 * organizer/member concept lives on plan_has_users, not here).
 */
export const OrganizationMemberSchema = t.Object({
  id: t.String(),
  firstName: t.Nullable(t.String()),
  lastName: t.Nullable(t.String()),
  imageUrl: t.Nullable(t.String()),
});

export const OrganizationDetailSchema = t.Object({
  id: t.String(),
  name: t.String(),
  description: t.Nullable(t.String()),
  websiteUrl: t.Nullable(t.String()),
  imageUrl: t.Nullable(t.String()),
  createdAt: t.Date(),
  members: t.Array(OrganizationMemberSchema),
});
