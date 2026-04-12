import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { planMessageTable, planTable } from "@/db/schema";
import { getUserFromRequest } from "@/api/routes/@shared/auth";
import {
  SimpleSuccessResponse,
  ErrorFieldResponse,
} from "@/api/schemas/common.schema";

export const planChatDeleteDeleteRoute = new Elysia().delete(
  "/delete",
  async ({ body, request, set }) => {
    const user = getUserFromRequest(request);

    const message = await db
      .select({
        id: planMessageTable.id,
        userId: planMessageTable.userId,
        planId: planMessageTable.planId,
      })
      .from(planMessageTable)
      .where(eq(planMessageTable.id, body.messageId))
      .limit(1);

    if (!message.length) {
      set.status = 404;
      return { error: "Message not found" };
    }

    const [msg] = message;

    if (msg.userId !== user.id) {
      const plan = await db
        .select({ creatorId: planTable.creatorId })
        .from(planTable)
        .where(eq(planTable.id, msg.planId))
        .limit(1);

      if (!plan.length || plan[0].creatorId !== user.id) {
        set.status = 403;
        return { error: "Not authorized to delete this message" };
      }
    }

    await db
      .delete(planMessageTable)
      .where(eq(planMessageTable.id, body.messageId));

    return { success: true };
  },
  {
    body: t.Object({
      messageId: t.String(),
    }),
    response: {
      200: SimpleSuccessResponse,
      403: ErrorFieldResponse,
      404: ErrorFieldResponse,
    },
  },
);
