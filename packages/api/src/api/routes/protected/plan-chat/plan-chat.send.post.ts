import { Elysia, t } from "elysia";

import { db } from "@/db";
import { planMessageTable } from "@/db/schema";
import { getUserFromRequest } from "@/api/routes/@shared/auth";
import { SuccessResponse } from "@/api/schemas/common.schema";
import { BasicMessageSchema } from "@/api/schemas/plan-chat.schema";

export const planChatSendPostRoute = new Elysia().post(
  "/send",
  async ({ body, request }) => {
    const user = getUserFromRequest(request);

    const [message] = await db
      .insert(planMessageTable)
      .values({
        userId: user.id,
        planId: body.planId,
        message: body.message,
      })
      .returning();

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
