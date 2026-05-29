import { t } from "elysia";

import { PaginatedSchema } from "@/api/schemas/common.schema";
import { PlanStatusSchema, PlanTypeSchema } from "@/api/schemas/enums";

/**
 * 400 payload returned by plan create/update when one of the link-URL
 * fields is malformed. `error: "INVALID_URL"` lets old clients keep
 * showing a generic message; `field` lets new clients highlight the
 * offending input.
 */
export const PlanLinkUrlErrorResponse = t.Object({
  error: t.Literal("INVALID_URL"),
  field: t.Union([
    t.Literal("whatsappGroupUrl"),
    t.Literal("wikilocUrl"),
    t.Literal("stravaUrl"),
  ]),
});

/**
 * Schema for a user participating in a plan.
 *
 * `role` is additive — older clients that don't read it keep working since
 * the field is non-required-by-omission for them; new builds use it to sort
 * organizers first and badge them in the participant list.
 */
export const PlanUserSchema = t.Object({
  id: t.String(),
  firstName: t.Nullable(t.String()),
  lastName: t.Nullable(t.String()),
  imageUrl: t.Nullable(t.String()),
  willBringDogs: t.Boolean(),
  role: t.Union([t.Literal("member"), t.Literal("organizer")]),
});

/**
 * Schema for the organization hosting a plan, when one is set. Returned as
 * a nested object on `PlanSchema` / `PlanDetailSchema` so mobile clients
 * can render a "Hosted by" row without a second round trip.
 */
export const PlanOrganizationSchema = t.Object({
  id: t.String(),
  name: t.String(),
  imageUrl: t.Nullable(t.String()),
});

/**
 * Schema for a mountain in a plan
 */
export const PlanMountainSchema = t.Object({
  id: t.String(),
  name: t.String(),
  slug: t.String(),
  imageUrl: t.Nullable(t.String()),
  location: t.String(),
  height: t.String(),
});

/**
 * Schema for a mountain in a plan with essential field
 */
export const PlanMountainWithEssentialSchema = t.Object({
  id: t.String(),
  name: t.String(),
  slug: t.String(),
  imageUrl: t.Nullable(t.String()),
  location: t.String(),
  height: t.String(),
  essential: t.Boolean(),
});

/**
 * Schema for a plan with relations
 */
export const PlanSchema = t.Object({
  id: t.String(),
  title: t.String(),
  description: t.Nullable(t.String()),
  imageUrl: t.Nullable(t.String()),
  speed: t.Nullable(t.String()),
  type: t.Nullable(PlanTypeSchema),
  status: PlanStatusSchema,
  routeUrl: t.Nullable(t.String()),
  whatsappGroupUrl: t.Nullable(t.String()),
  wikilocUrl: t.Nullable(t.String()),
  stravaUrl: t.Nullable(t.String()),
  startDate: t.Nullable(t.String()),
  startTime: t.Nullable(t.String()),
  creatorId: t.String(),
  createdAt: t.Date(),
  updatedAt: t.Date(),
  challengeId: t.Nullable(t.String()),
  isPrivate: t.Boolean(),
  featured: t.Boolean(),
  users: t.Array(PlanUserSchema),
  mountains: t.Array(PlanMountainSchema),
  organization: t.Nullable(PlanOrganizationSchema),
});

/**
 * Schema for detailed plan (with essential field on mountains)
 */
export const PlanDetailSchema = t.Object({
  id: t.String(),
  title: t.String(),
  description: t.Nullable(t.String()),
  imageUrl: t.Nullable(t.String()),
  speed: t.Nullable(t.String()),
  type: t.Nullable(PlanTypeSchema),
  status: t.String(),
  routeUrl: t.Nullable(t.String()),
  whatsappGroupUrl: t.Nullable(t.String()),
  wikilocUrl: t.Nullable(t.String()),
  stravaUrl: t.Nullable(t.String()),
  startDate: t.Nullable(t.String()),
  startTime: t.Nullable(t.String()),
  creatorId: t.String(),
  createdAt: t.Date(),
  updatedAt: t.Date(),
  isPrivate: t.Boolean(),
  featured: t.Boolean(),
  users: t.Array(PlanUserSchema),
  mountains: t.Array(PlanMountainWithEssentialSchema),
  organization: t.Nullable(PlanOrganizationSchema),
});

/**
 * Schema for array of plans
 */
export const PlansArraySchema = t.Array(PlanSchema);

/**
 * Schema for paginated plans response
 */
export const PaginatedPlansSchema = PaginatedSchema(PlanSchema);

/**
 * Schema for count response
 */
export const CountResponseSchema = t.Object({
  success: t.Boolean(),
  count: t.Number(),
});

/**
 * Schema for basic plan without relations
 */
export const BasicPlanSchema = t.Object({
  id: t.String(),
  title: t.String(),
  description: t.Nullable(t.String()),
  imageUrl: t.Nullable(t.String()),
  speed: t.Nullable(t.String()),
  type: t.Nullable(PlanTypeSchema),
  status: t.String(),
  routeUrl: t.Nullable(t.String()),
  whatsappGroupUrl: t.Nullable(t.String()),
  wikilocUrl: t.Nullable(t.String()),
  stravaUrl: t.Nullable(t.String()),
  startDate: t.Nullable(t.String()),
  startTime: t.Nullable(t.String()),
  creatorId: t.String(),
  createdAt: t.Date(),
  updatedAt: t.Date(),
  challengeId: t.Nullable(t.String()),
  isPrivate: t.Boolean(),
});
