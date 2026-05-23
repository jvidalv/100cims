import { t } from "elysia";

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

export const CalendarEventSchema = t.Union([CalendarSummitEventSchema]);

export const CalendarResponseSchema = t.Object({
  events: t.Array(CalendarEventSchema),
});
