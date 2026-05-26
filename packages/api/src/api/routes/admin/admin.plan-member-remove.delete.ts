import { and, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { PLAN_USER_LOG_ACTIONS } from "@/db/enums";
import { planHasUsersTable, planUserLogTable } from "@/db/schema";
import {
  ErrorFieldResponse,
  SimpleSuccessResponse,
} from "@/api/schemas/common.schema";

export const adminPlanMemberRemoveDeleteRoute = new Elysia().delete(
  "/plans/:id/members/:userId",
  async ({ params, set }) => {
    const [row] = await db
      .delete(planHasUsersTable)
      .where(
        and(
          eq(planHasUsersTable.planId, params.id),
          eq(planHasUsersTable.userId, params.userId),
        ),
      )
      .returning({ id: planHasUsersTable.id });

    if (!row) {
      set.status = 404;
      return { error: "Membership not found" };
    }

    await db.insert(planUserLogTable).values({
      planId: params.id,
      userId: params.userId,
      action: PLAN_USER_LOG_ACTIONS.LEFT,
    });

    return { success: true };
  },
  {
    params: t.Object({ id: t.String(), userId: t.String() }),
    response: {
      200: SimpleSuccessResponse,
      404: ErrorFieldResponse,
    },
  },
);
