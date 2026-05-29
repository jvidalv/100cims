import { t } from "elysia";

// Shared role schema for plan participants. Spelled out as a literal-tuple
// rather than mapped from the enum array so TypeBox keeps the narrow
// `"member" | "organizer"` inference — `.map` would collapse to
// `TLiteral<string>[]`. Re-exported here (despite living in the
// organization schema file historically) because plan schemas import it.
export const PlanMemberRoleSchema = t.Union([
  t.Literal("member"),
  t.Literal("organizer"),
]);

export const AdminOrganizationListItemSchema = t.Object({
  id: t.String(),
  name: t.String(),
  imageUrl: t.Nullable(t.String()),
  memberCount: t.Number(),
  createdAt: t.Date(),
});

export const AdminOrganizationsResponseSchema = t.Object({
  items: t.Array(AdminOrganizationListItemSchema),
  page: t.Number(),
  pageSize: t.Number(),
  total: t.Number(),
  totalPages: t.Number(),
});

// Flat membership shape — no role field. Organizer-vs-member is a
// per-plan concept, surfaced on plan participants instead.
export const AdminOrganizationMemberSchema = t.Object({
  userId: t.String(),
  firstName: t.Nullable(t.String()),
  lastName: t.Nullable(t.String()),
  imageUrl: t.Nullable(t.String()),
  joinedAt: t.Date(),
});

export const AdminOrganizationDetailSchema = t.Object({
  id: t.String(),
  name: t.String(),
  description: t.Nullable(t.String()),
  websiteUrl: t.Nullable(t.String()),
  imageUrl: t.Nullable(t.String()),
  createdAt: t.Date(),
  updatedAt: t.Date(),
  members: t.Array(AdminOrganizationMemberSchema),
});

export const AdminOrganizationCreateBodySchema = t.Object({
  name: t.String({ minLength: 1 }),
  description: t.Optional(t.String()),
  websiteUrl: t.Optional(t.String()),
  imageUrl: t.Optional(t.String()),
});

export const AdminOrganizationUpdateBodySchema = t.Object({
  name: t.Optional(t.String({ minLength: 1 })),
  description: t.Optional(t.Nullable(t.String())),
  websiteUrl: t.Optional(t.Nullable(t.String())),
  imageUrl: t.Optional(t.Nullable(t.String())),
});

export const AdminOrganizationMemberAddBodySchema = t.Object({
  userId: t.String(),
});

// Body schema for PATCH /admin/plans/:id/members/:userId/role. Lives here
// (next to the role enum) so the plan route and any future admin UI agree
// on shape without duplicating literals.
export const AdminPlanMemberRoleBodySchema = t.Object({
  role: PlanMemberRoleSchema,
});
