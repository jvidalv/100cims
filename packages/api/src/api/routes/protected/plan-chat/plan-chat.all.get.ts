import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { planMessageTable, userTable } from "@/db/schema";
import { SuccessResponse } from "@/api/schemas/common.schema";
import { PlanMessagesArraySchema } from "@/api/schemas/plan-chat.schema";

export const planChatAllGetRoute = new Elysia().get(
  "/all",
  async ({ query }) => {
    const messages = await db
      .select({
        id: planMessageTable.id,
        message: planMessageTable.message,
        createdAt: planMessageTable.createdAt,
        user: {
          id: userTable.id,
          firstName: userTable.firstName,
          lastName: userTable.lastName,
          imageUrl: userTable.imageUrl,
        },
      })
      .from(planMessageTable)
      .innerJoin(userTable, eq(planMessageTable.userId, userTable.id))
      .where(eq(planMessageTable.planId, query.planId))
      .orderBy(planMessageTable.createdAt);

    return { success: true, message: messages };
  },
  {
    query: t.Object({
      planId: t.String(),
    }),
    response: SuccessResponse(PlanMessagesArraySchema),
  },
);
