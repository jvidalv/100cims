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
  // Social URLs — null when the org hasn't filled that platform in.
  // Mobile renders them as a row of tappable icons on /organization/[id].
  instagramUrl: t.Nullable(t.String()),
  tiktokUrl: t.Nullable(t.String()),
  whatsappUrl: t.Nullable(t.String()),
  youtubeUrl: t.Nullable(t.String()),
  stravaUrl: t.Nullable(t.String()),
  // Showcase gallery (0–10 CDN URLs). Renders as a wrapping carousel of
  // square thumbs at the bottom of /organization/[id] on mobile, with a
  // tap-to-lightbox interaction.
  photoUrls: t.Array(t.String()),
  createdAt: t.Date(),
  members: t.Array(OrganizationMemberSchema),
});
