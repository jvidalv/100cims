import { and, asc, eq, inArray } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import {
  mountainTable,
  planHasMountainsTable,
  planHasUsersTable,
  planTable,
  userTable,
} from "@/db/schema";
import { JWT } from "@/api/routes/@shared/jwt";
import {
  getBearerToken,
  getOptionalUserId,
} from "@/api/routes/@shared/optional-auth";
import { planVisibilitySql } from "@/api/routes/@shared/plan-access";
import { planParticipantsOrderBy } from "@/api/routes/@shared/plan-organization";
import { CalendarPlanEventSchema } from "@/api/schemas/calendar.schema";
import { SuccessResponse } from "@/api/schemas/common.schema";

/**
 * Per-mountain row shape. Mirrors `CalendarPlanEventSchema` so the mobile
 * `PlanItemListCompact` molecule consumes it as-is, but widens `date` to
 * nullable — plans here may not have a start date set, whereas the calendar
 * endpoint guarantees one via its date-range filter. `isCreator` is dropped
 * because no current consumer reads it.
 */
const PlanByMountainEventSchema = t.Composite([
  t.Omit(CalendarPlanEventSchema, ["date", "isCreator"]),
  t.Object({
    date: t.Nullable(
      t.String({ description: "YYYY-MM-DD plan start date, or null" }),
    ),
    /** Custom plan cover image — takes precedence over the mountain
     *  thumbnail in PlanItemListCompact. */
    imageUrl: t.Nullable(t.String()),
  }),
]);

/**
 * Open plans that include a given mountain — drives the "Open plans"
 * section on the mountain detail screen. Status filtered to "open" so only
 * joinable plans surface; ordered by start date ascending so soonest first.
 */
export const planByMountainGetRoute = new Elysia().use(JWT()).get(
  "/by-mountain",
  async ({ query, jwt, headers }) => {
    const viewerId = await getOptionalUserId(jwt, getBearerToken(headers));

    const plans = await db
      .select({
        id: planTable.id,
        title: planTable.title,
        startDate: planTable.startDate,
        status: planTable.status,
        planType: planTable.type,
        isPrivate: planTable.isPrivate,
        featured: planTable.featured,
        imageUrl: planTable.imageUrl,
      })
      .from(planTable)
      .innerJoin(
        planHasMountainsTable,
        eq(planHasMountainsTable.planId, planTable.id),
      )
      .innerJoin(
        mountainTable,
        eq(mountainTable.id, planHasMountainsTable.mountainId),
      )
      .where(
        and(
          eq(mountainTable.slug, query.mountainSlug),
          eq(planTable.status, "open"),
          planVisibilitySql(viewerId),
        ),
      )
      .orderBy(asc(planTable.startDate));

    if (plans.length === 0) {
      return { success: true, message: { events: [] } };
    }

    const planIds = plans.map((p) => p.id);
    const [users, mountains] = await Promise.all([
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
        .orderBy(...planParticipantsOrderBy()),

      db
        .select({
          planId: planHasMountainsTable.planId,
          imageUrl: mountainTable.imageUrl,
        })
        .from(planHasMountainsTable)
        .innerJoin(
          mountainTable,
          eq(mountainTable.id, planHasMountainsTable.mountainId),
        )
        .where(inArray(planHasMountainsTable.planId, planIds)),
    ]);

    // Bucket once, lookup in O(1) per plan — mirrors plan.all-paginated.get.ts.
    const usersByPlan = new Map<
      string,
      {
        id: string;
        firstName: string | null;
        lastName: string | null;
        imageUrl: string | null;
      }[]
    >();
    for (const u of users) {
      if (!u.planId) continue;
      const list = usersByPlan.get(u.planId) ?? [];
      list.push({
        id: u.userId,
        firstName: u.firstName,
        lastName: u.lastName,
        imageUrl: u.imageUrl,
      });
      usersByPlan.set(u.planId, list);
    }

    const mountainsByPlan = new Map<string, { imageUrl: string | null }[]>();
    for (const m of mountains) {
      if (!m.planId) continue;
      const list = mountainsByPlan.get(m.planId) ?? [];
      list.push({ imageUrl: m.imageUrl });
      mountainsByPlan.set(m.planId, list);
    }

    const events = plans.map((p) => ({
      type: "plan" as const,
      date: p.startDate,
      id: p.id,
      title: p.title,
      status: p.status,
      planType: p.planType,
      isPrivate: p.isPrivate,
      featured: p.featured,
      imageUrl: p.imageUrl,
      mountains: mountainsByPlan.get(p.id) ?? [],
      users: usersByPlan.get(p.id) ?? [],
    }));

    return { success: true, message: { events } };
  },
  {
    query: t.Object({
      mountainSlug: t.String(),
    }),
    response: SuccessResponse(
      t.Object({ events: t.Array(PlanByMountainEventSchema) }),
    ),
  },
);
