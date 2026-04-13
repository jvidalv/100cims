import { and, eq, ne } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { planMessageTable, planTable, planHasUsersTable } from "@/db/schema";
import { truncate } from "@/api/lib/discord";
import { sendPushLocalized } from "@/api/lib/push";
import { pushPlanChat } from "@/api/lib/push-translations";
import { PUSH_TYPE, getUserDisplayName } from "@/api/lib/push-types";
import { getUserFromRequest } from "@/api/routes/@shared/auth";
import { SuccessResponse } from "@/api/schemas/common.schema";
import { BasicMessageSchema } from "@/api/schemas/plan-chat.schema";

export const planChatSendPostRoute = new Elysia().post(
  "/send",
  async ({ body, request }) => {
    const user = getUserFromRequest(request);

    const [[message], [plan], participants] = await Promise.all([
      db
        .insert(planMessageTable)
        .values({
          userId: user.id,
          planId: body.planId,
          message: body.message,
        })
        .returning(),
      db
        .select({ title: planTable.title, creatorId: planTable.creatorId })
        .from(planTable)
        .where(eq(planTable.id, body.planId))
        .limit(1),
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

    if (plan) {
      const recipientIds = new Set<string>(participants.map((p) => p.userId));
      if (plan.creatorId !== user.id) recipientIds.add(plan.creatorId);

      const senderName = getUserDisplayName(user);
      const preview = truncate(body.message, 120);

      void sendPushLocalized(
        Array.from(recipientIds),
        () => ({
          title: plan.title,
          body: pushPlanChat(senderName, preview),
        }),
        { type: PUSH_TYPE.PLAN_CHAT, planId: body.planId },
      );
    }

    return { success: true, message };
  },
  {
    body: t.Object({
      planId: t.String(),
      message: t.String(),
    }),
    response: SuccessResponse(BasicMessageSchema),
  },
);
