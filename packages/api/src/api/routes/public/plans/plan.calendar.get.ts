import { and, asc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { planParticipantsOrderBy } from "@/api/routes/@shared/plan-organization";
import { CalendarResponseSchema } from "@/api/schemas/calendar.schema";
import { SuccessResponse } from "@/api/schemas/common.schema";
import { db } from "@/db";
import {
  mountainTable,
  planHasMountainsTable,
  planHasUsersTable,
  planTable,
  userTable,
} from "@/db/schema";

// Public-facing calendar — returns every non-private plan with a
// startDate inside the requested window, no per-user filtering, no
// summits. Same `CalendarResponseSchema` as the protected variant so
// the mobile hook can swap endpoints without touching consumers. Used
// by `/calendar` when the viewer is unauthenticated.
export const planCalendarGetRoute = new Elysia().get(
  "/calendar",
  async ({ query }) => {
    const planRows = await db
      .select({
        id: planTable.id,
        startDate: sql<string>`${planTable.startDate}`.as("startDate"),
        title: planTable.title,
        status: planTable.status,
        type: planTable.type,
        isPrivate: planTable.isPrivate,
        featured: planTable.featured,
        imageUrl: planTable.imageUrl,
      })
      .from(planTable)
      .where(
        and(
          // Private plans are invite-only; never leak them to an anon viewer.
          eq(planTable.isPrivate, false),
          gte(planTable.startDate, query.from),
          lte(planTable.startDate, query.to),
        ),
      )
      // SQL ORDER BY is the only sort here — unlike the protected route
      // (which interleaves summit + plan events with a JS sort), the
      // public payload is plan-only. If a second event type gets added
      // to this endpoint later, add a JS merge-sort after the map.
      .orderBy(asc(planTable.startDate));

    const planIds = planRows.map((p) => p.id);

    // Mirror the protected route's per-plan fetch + short-circuit on
    // empty (Postgres rejects `IN ()`).
    const fetchPlanMountains = () =>
      db
        .select({
          planId: planHasMountainsTable.planId,
          imageUrl: mountainTable.imageUrl,
        })
        .from(planHasMountainsTable)
        .innerJoin(
          mountainTable,
          eq(planHasMountainsTable.mountainId, mountainTable.id),
        )
        .where(inArray(planHasMountainsTable.planId, planIds));
    const fetchPlanUsers = () =>
      db
        .select({
          planId: planHasUsersTable.planId,
          userId: userTable.id,
          firstName: userTable.firstName,
          lastName: userTable.lastName,
          imageUrl: userTable.imageUrl,
        })
        .from(planHasUsersTable)
        .innerJoin(userTable, eq(planHasUsersTable.userId, userTable.id))
        .where(inArray(planHasUsersTable.planId, planIds))
        .orderBy(...planParticipantsOrderBy());

    const [planMountains, planUsers] =
      planIds.length > 0
        ? await Promise.all([fetchPlanMountains(), fetchPlanUsers()])
        : [[], []];

    const events = planRows.map((row) => ({
      type: "plan" as const,
      date: row.startDate,
      id: row.id,
      title: row.title,
      status: row.status,
      planType: row.type,
      isPrivate: row.isPrivate,
      featured: row.featured,
      // Anon viewers can't be a creator. Keep the field so the schema
      // matches the protected variant byte-for-byte.
      isCreator: false,
      // Anon viewers can't be joined either; the protected variant
      // computes this from a LEFT JOIN on plan_has_users.
      isJoined: false,
      imageUrl: row.imageUrl,
      mountains: planMountains
        .filter((m) => m.planId === row.id)
        .map(({ imageUrl }) => ({ imageUrl })),
      users: planUsers
        .filter((u) => u.planId === row.id)
        .map(({ userId, firstName, lastName, imageUrl }) => ({
          id: userId,
          firstName,
          lastName,
          imageUrl,
        })),
    }));

    return { success: true as const, message: { events } };
  },
  {
    query: t.Object({
      from: t.String({ description: "YYYY-MM-DD inclusive" }),
      to: t.String({ description: "YYYY-MM-DD inclusive" }),
    }),
    response: SuccessResponse(CalendarResponseSchema),
  },
);
