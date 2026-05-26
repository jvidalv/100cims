import { asc, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { planUserLogTable, userTable } from "@/db/schema";
import { AdminPlanMemberLogResponseSchema } from "@/api/schemas/admin.schema";
import {
  ErrorFieldResponse,
  SuccessResponse,
} from "@/api/schemas/common.schema";

/**
 * Chronological audit of join/leave events for a plan, oldest first.
 * Backs the "Member activity" table on the admin plan detail page.
 * `planUserLogTable.action` is typed via `.$type<PlanUserLogAction>()` so
 * the row's `action` already narrows to the response-schema union — no
 * cast needed here. Unbounded for now; single plans rarely accumulate more
 * than a few dozen events.
 */
export const adminPlanMemberLogGetRoute = new Elysia().get(
  "/plans/:id/member-log",
  async ({ params }) => {
    const items = await db
      .select({
        id: planUserLogTable.id,
        userId: planUserLogTable.userId,
        username: userTable.username,
        firstName: userTable.firstName,
        lastName: userTable.lastName,
        imageUrl: userTable.imageUrl,
        action: planUserLogTable.action,
        timestamp: planUserLogTable.timestamp,
      })
      .from(planUserLogTable)
      .innerJoin(userTable, eq(planUserLogTable.userId, userTable.id))
      .where(eq(planUserLogTable.planId, params.id))
      .orderBy(asc(planUserLogTable.timestamp));

    return { success: true, message: { items } };
  },
  {
    params: t.Object({ id: t.String() }),
    response: {
      200: SuccessResponse(AdminPlanMemberLogResponseSchema),
      404: ErrorFieldResponse,
    },
  },
);
