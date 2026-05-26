import { and, asc, eq, gte, inArray, lte, or, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { getUserFromRequest } from "@/api/routes/@shared/auth";
import { CalendarResponseSchema } from "@/api/schemas/calendar.schema";
import { SuccessResponse } from "@/api/schemas/common.schema";
import { db } from "@/db";
import {
  mountainTable,
  planHasMountainsTable,
  planHasUsersTable,
  planTable,
  summitHasUsersTable,
  summitTable,
  userTable,
} from "@/db/schema";

export const userCalendarGetRoute = new Elysia().get(
  "/calendar",
  async ({ request, query }) => {
    const user = getUserFromRequest(request);

    // Phase 1: fetch summits + plans the user is involved in within the
    // date range. Two parallel queries instead of a UNION since their
    // column shapes differ.
    const [summitRows, planRows] = await Promise.all([
      db
        .select({
          id: summitTable.id,
          summitedAt: summitTable.summitedAt,
          mountainName: mountainTable.name,
          mountainSlug: mountainTable.slug,
          mountainHeight: mountainTable.height,
          mountainImageUrl: mountainTable.imageUrl,
        })
        .from(summitHasUsersTable)
        .innerJoin(
          summitTable,
          eq(summitHasUsersTable.summitId, summitTable.id),
        )
        .innerJoin(mountainTable, eq(summitTable.mountainId, mountainTable.id))
        .where(
          and(
            eq(summitHasUsersTable.userId, user.id),
            gte(summitTable.summitedAt, query.from),
            lte(summitTable.summitedAt, query.to),
          ),
        )
        .orderBy(asc(summitTable.summitedAt)),

      // Left-outer-join plan_has_users with the JOIN condition pinned to the
      // current user, so at most one participant row matches per plan. That
      // lets the WHERE keep either creator or participant rows in one pass,
      // without needing DISTINCT. The WHERE's `gte(startDate, ...)` discards
      // NULL start dates in Postgres, so `sql<string>` types the field
      // non-null and downstream code can use it without re-checking.
      db
        .select({
          id: planTable.id,
          startDate: sql<string>`${planTable.startDate}`.as("startDate"),
          title: planTable.title,
          status: planTable.status,
          type: planTable.type,
          isPrivate: planTable.isPrivate,
          creatorId: planTable.creatorId,
          imageUrl: planTable.imageUrl,
        })
        .from(planTable)
        .leftJoin(
          planHasUsersTable,
          and(
            eq(planHasUsersTable.planId, planTable.id),
            eq(planHasUsersTable.userId, user.id),
          ),
        )
        .where(
          and(
            or(
              eq(planTable.creatorId, user.id),
              eq(planHasUsersTable.userId, user.id),
            ),
            gte(planTable.startDate, query.from),
            lte(planTable.startDate, query.to),
          ),
        )
        .orderBy(asc(planTable.startDate)),
    ]);

    // Phase 2: for the plans we found, fetch their mountains + users in
    // parallel. PlanItemList on the mobile side expects both. Drizzle's
    // `inArray(col, [])` would emit `IN ()`, which Postgres rejects as a
    // syntax error — so the empty case has to short-circuit before the query.
    // Wrap each fetch in a thunk so the per-row types come from the select
    // builder itself (no casts needed for the empty short-circuit).
    const planIds = planRows.map((p) => p.id);
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
        .where(inArray(planHasUsersTable.planId, planIds));

    const [planMountains, planUsers] =
      planIds.length > 0
        ? await Promise.all([fetchPlanMountains(), fetchPlanUsers()])
        : [[], []];

    const summitEvents = summitRows.map((row) => ({
      type: "summit" as const,
      date: row.summitedAt,
      id: row.id,
      mountainName: row.mountainName,
      mountainSlug: row.mountainSlug,
      mountainHeight: row.mountainHeight,
      mountainImageUrl: row.mountainImageUrl,
    }));

    const planEvents = planRows.map((row) => ({
      type: "plan" as const,
      date: row.startDate,
      id: row.id,
      title: row.title,
      status: row.status,
      planType: row.type,
      isPrivate: row.isPrivate,
      isCreator: row.creatorId === user.id,
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

    const events = [...summitEvents, ...planEvents].sort((a, b) =>
      a.date.localeCompare(b.date),
    );

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
