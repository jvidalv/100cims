import { t } from "elysia";

/**
 * Schema for a user participating in a plan
 */
export const PlanUserSchema = t.Object({
  id: t.String(),
  firstName: t.Nullable(t.String()),
  lastName: t.Nullable(t.String()),
  imageUrl: t.Nullable(t.String()),
  willBringDogs: t.Boolean(),
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
  status: t.Union([
    t.Literal("open"),
    t.Literal("canceled"),
    t.Literal("completed"),
  ]),
  routeUrl: t.Nullable(t.String()),
  startDate: t.Nullable(t.String()),
  creatorId: t.String(),
  createdAt: t.Date(),
  updatedAt: t.Date(),
  challengeId: t.Nullable(t.String()),
  users: t.Array(PlanUserSchema),
  mountains: t.Array(PlanMountainSchema),
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
  status: t.String(),
  routeUrl: t.Nullable(t.String()),
  startDate: t.Nullable(t.String()),
  creatorId: t.String(),
  createdAt: t.Date(),
  updatedAt: t.Date(),
  users: t.Array(PlanUserSchema),
  mountains: t.Array(PlanMountainWithEssentialSchema),
});

/**
 * Schema for array of plans
 */
export const PlansArraySchema = t.Array(PlanSchema);

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
  status: t.String(),
  routeUrl: t.Nullable(t.String()),
  startDate: t.Nullable(t.String()),
  creatorId: t.String(),
  createdAt: t.Date(),
  updatedAt: t.Date(),
  challengeId: t.Nullable(t.String()),
});
