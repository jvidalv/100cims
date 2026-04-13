import { and, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { planTable, planHasUsersTable, planUserLogTable } from "@/db/schema";
import { sendPushLocalized } from "@/api/lib/push";
import { pushPlanJoined } from "@/api/lib/push-translations";
import { PUSH_TYPE, getUserDisplayName } from "@/api/lib/push-types";
import { getUserFromRequest } from "@/api/routes/@shared/auth";
import {
  SimpleSuccessResponse,
  ErrorFieldResponse,
} from "@/api/schemas/common.schema";

export const planJoinPostRoute = new Elysia().post(
  "/join",
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

    if (targetPlan.status !== "open") {
      set.status = 400;
      return { error: "Plan is not open for joining" };
    }

    if (targetPlan.creatorId === user.id) {
      set.status = 400;
      return { error: "You are the creator of this plan" };
    }

    const alreadyJoined = await db
      .select({ id: planHasUsersTable.planId })
      .from(planHasUsersTable)
      .where(
        and(
          eq(planHasUsersTable.planId, body.id),
          eq(planHasUsersTable.userId, user.id),
        ),
      )
      .limit(1);

    if (alreadyJoined.length) {
      set.status = 400;
      return { error: "You already joined this plan" };
    }

    await db.transaction(async (tx) => {
      await tx.insert(planUserLogTable).values({
        planId: body.id,
        userId: user.id,
        action: "joined",
      });

      await tx.insert(planHasUsersTable).values({
        userId: user.id,
        planId: body.id,
        willBringDogs: false,
      });
    });

    const joinerName = getUserDisplayName(user);

    void sendPushLocalized(
      [targetPlan.creatorId],
      (locale) => ({
        title: targetPlan.title,
        body: pushPlanJoined(locale, joinerName),
      }),
      { type: PUSH_TYPE.PLAN_JOIN, planId: body.id },
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
