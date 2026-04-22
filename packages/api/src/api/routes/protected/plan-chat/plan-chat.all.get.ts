import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { planMessageTable, planTable, userTable } from "@/db/schema";
import { getUserFromRequest } from "@/api/routes/@shared/auth";
import { canReadPlan } from "@/api/routes/@shared/plan-access";
import {
  SuccessResponse,
  ErrorFieldResponse,
} from "@/api/schemas/common.schema";
import { PlanMessagesArraySchema } from "@/api/schemas/plan-chat.schema";

export const planChatAllGetRoute = new Elysia().get(
  "/all",
  async ({ query, request, set }) => {
    const user = getUserFromRequest(request);

    const [plan] = await db
      .select({
        id: planTable.id,
        creatorId: planTable.creatorId,
        isPrivate: planTable.isPrivate,
      })
      .from(planTable)
      .where(eq(planTable.id, query.planId))
      .limit(1);

    if (!plan || !(await canReadPlan({ plan, viewerId: user.id }))) {
      set.status = 404;
      return { error: "Plan not found" };
    }

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
    response: {
      200: SuccessResponse(PlanMessagesArraySchema),
      404: ErrorFieldResponse,
    },
  },
);
