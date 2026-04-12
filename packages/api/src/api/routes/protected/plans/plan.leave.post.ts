import { and, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import {
  planTable,
  planHasUsersTable,
  planUserLogTable,
} from "@/db/schema";
import { sendPushLocalized } from "@/api/lib/push";
import { pushPlanLeft } from "@/api/lib/push-translations";
import { PUSH_TYPE, getUserDisplayName } from "@/api/lib/push-types";
import { getUserFromRequest } from "@/api/routes/@shared/auth";
import {
  SimpleSuccessResponse,
  ErrorFieldResponse,
} from "@/api/schemas/common.schema";

export const planLeavePostRoute = new Elysia().post(
  "/leave",
  async ({ body, request, set }) => {
    const user = getUserFromRequest(request);

    const plan = await db
      .select({
        id: planTable.id,
        creatorId: planTable.creatorId,
        status: planTable.status,
        title: planTable.title,
      })
      .from(planTable)
      .where(eq(planTable.id, body.id))
      .limit(1);

    if (!plan.length) {
      set.status = 404;
      return { error: "Plan not found" };
    }

    const [targetPlan] = plan;

    if (targetPlan.creatorId === user.id) {
      set.status = 400;
      return { error: "Creators cannot leave their own plan" };
    }

    await db.transaction(async (tx) => {
      await tx
        .delete(planHasUsersTable)
        .where(
          and(
            eq(planHasUsersTable.planId, body.id),
            eq(planHasUsersTable.userId, user.id),
          ),
        );

      await tx.insert(planUserLogTable).values({
        planId: body.id,
        userId: user.id,
        action: "left",
      });
    });

    const leaverName = getUserDisplayName(user);

    void sendPushLocalized(
      [targetPlan.creatorId],
      (locale) => ({
        title: targetPlan.title,
        body: pushPlanLeft(locale, leaverName),
      }),
      { type: PUSH_TYPE.PLAN_LEAVE, planId: body.id },
    );

    return { success: true };
  },
  {
    body: t.Object({
      id: t.String(),
    }),
    response: {
      200: SimpleSuccessResponse,
      400: ErrorFieldResponse,
      404: ErrorFieldResponse,
    },
  },
);
