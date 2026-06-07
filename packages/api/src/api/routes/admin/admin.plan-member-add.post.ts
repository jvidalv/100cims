import { Elysia, t } from "elysia";

import { db } from "@/db";
import { PLAN_USER_LOG_ACTIONS } from "@/db/enums";
import { planHasUsersTable, planUserLogTable } from "@/db/schema";
import {
  ErrorFieldResponse,
  SimpleSuccessResponse,
} from "@/api/schemas/common.schema";

export const adminPlanMemberAddPostRoute = new Elysia().post(
  "/plans/:id/members/:userId",
  async ({ params, set }) => {
    let inserted: { id: string } | undefined;
    try {
      [inserted] = await db
        .insert(planHasUsersTable)
        .values({ planId: params.id, userId: params.userId })
        .onConflictDoNothing()
        .returning({ id: planHasUsersTable.id });
    } catch (e) {
      // Postgres foreign-key violation → either the plan or the user id
      // doesn't exist. Duplicates are handled by onConflictDoNothing above.
      if ((e as { code?: string }).code === "23503") {
        set.status = 404;
        return { error: "Plan or user not found" };
      }
      throw e;
    }

    // No row inserted means the user was already a member — skip the log so we
    // don't record a spurious JOINED event on a re-add.
    if (inserted) {
      await db.insert(planUserLogTable).values({
        planId: params.id,
        userId: params.userId,
        action: PLAN_USER_LOG_ACTIONS.JOINED,
      });
    }

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
