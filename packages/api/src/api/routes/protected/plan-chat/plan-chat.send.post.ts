import { and, eq, ne } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { planMessageTable, planTable, planHasUsersTable } from "@/db/schema";
import { sendPushLocalized } from "@/api/lib/push";
import { pushPlanChat } from "@/api/lib/push-translations";
import { PUSH_TYPE } from "@/api/lib/push-types";
import { getUserFromRequest } from "@/api/routes/@shared/auth";
import { canReadPlan } from "@/api/routes/@shared/plan-access";
import {
  SuccessResponse,
  ErrorFieldResponse,
} from "@/api/schemas/common.schema";
import { BasicMessageSchema } from "@/api/schemas/plan-chat.schema";

export const planChatSendPostRoute = new Elysia().post(
  "/send",
  async ({ body, request, set }) => {
    const user = getUserFromRequest(request);

    const [plan] = await db
      .select({
        id: planTable.id,
        title: planTable.title,
        creatorId: planTable.creatorId,
        isPrivate: planTable.isPrivate,
      })
      .from(planTable)
      .where(eq(planTable.id, body.planId))
      .limit(1);

    if (!plan || !(await canReadPlan({ plan, viewerId: user.id }))) {
      set.status = 404;
      return { error: "Plan not found" };
    }

    const [[message], participants] = await Promise.all([
      db
        .insert(planMessageTable)
        .values({
          userId: user.id,
          planId: body.planId,
          message: body.message,
        })
        .returning(),
      db
        .select({ userId: planHasUsersTable.userId })
        .from(planHasUsersTable)
        .where(
          and(
            eq(planHasUsersTable.planId, body.planId),
            ne(planHasUsersTable.userId, user.id),
          ),
        ),
    ]);

    const recipientIds = new Set<string>(participants.map((p) => p.userId));
    if (plan.creatorId !== user.id) recipientIds.add(plan.creatorId);

    void sendPushLocalized(
      Array.from(recipientIds),
      (locale) => ({
        title: plan.title,
        body: pushPlanChat(locale),
      }),
      { type: PUSH_TYPE.PLAN_CHAT, planId: body.planId },
    );

    return { success: true, message };
  },
  {
    body: t.Object({
      planId: t.String(),
      message: t.String(),
    }),
    response: {
      200: SuccessResponse(BasicMessageSchema),
      404: ErrorFieldResponse,
    },
  },
);
