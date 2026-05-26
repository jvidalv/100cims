import { t } from "elysia";

import { PlanStatusSchema, PlanTypeSchema } from "@/api/schemas/enums";

/**
 * Discriminated-union event shape used by `/api/protected/user/calendar`.
 * Add new event types by extending the union — clients can switch on `type`
 * and existing types stay untouched (additive change).
 */
export const CalendarSummitEventSchema = t.Object({
  type: t.Literal("summit"),
  date: t.String({ description: "YYYY-MM-DD in the user's local timezone" }),
  id: t.String(),
  mountainName: t.String(),
  mountainSlug: t.String(),
  mountainHeight: t.String(),
  mountainImageUrl: t.Nullable(t.String()),
});

export const CalendarPlanEventSchema = t.Object({
  type: t.Literal("plan"),
  date: t.String({ description: "YYYY-MM-DD plan start date" }),
  id: t.String(),
  title: t.String(),
  status: PlanStatusSchema,
  planType: t.Nullable(PlanTypeSchema),
  isPrivate: t.Boolean(),
  isCreator: t.Boolean(),
  /** Custom plan cover image. Takes precedence over the mountain collage
   *  in PlanItemListCompact. */
  imageUrl: t.Nullable(t.String()),
  // Shaped to match PlanItemList's expected props so the mobile row can drop
  // it in unchanged. Mountains carry only imageUrl (the home-page collage).
  mountains: t.Array(
    t.Object({
      imageUrl: t.Nullable(t.String()),
    }),
  ),
  users: t.Array(
    t.Object({
      id: t.String(),
      firstName: t.Nullable(t.String()),
      lastName: t.Nullable(t.String()),
      imageUrl: t.Nullable(t.String()),
    }),
  ),
});

export const CalendarEventSchema = t.Union([
  CalendarSummitEventSchema,
  CalendarPlanEventSchema,
]);

export const CalendarResponseSchema = t.Object({
  events: t.Array(CalendarEventSchema),
});
