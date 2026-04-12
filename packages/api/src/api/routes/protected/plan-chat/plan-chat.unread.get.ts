import { eq, inArray } from "drizzle-orm";
import { Elysia } from "elysia";

import { db } from "@/db";
import {
  planHasUsersTable,
  planMessageTable,
  planUserMessageReadTable,
} from "@/db/schema";
import { getUserFromRequest } from "@/api/routes/@shared/auth";
import { SuccessResponse } from "@/api/schemas/common.schema";
import { UnreadPlansSchema } from "@/api/schemas/plan-chat.schema";

export const planChatUnreadGetRoute = new Elysia().get(
  "/unread",
  async ({ request }) => {
    const user = getUserFromRequest(request);

    const [lastReads, userPlans] = await Promise.all([
      db
        .select({
          planId: planUserMessageReadTable.planId,
          lastReadAt: planUserMessageReadTable.lastReadAt,
        })
        .from(planUserMessageReadTable)
        .where(eq(planUserMessageReadTable.userId, user.id)),
      db
        .select({ planId: planHasUsersTable.planId })
        .from(planHasUsersTable)
        .where(eq(planHasUsersTable.userId, user.id)),
    ]);

    const lastReadMap = new Map(
      lastReads.map(({ planId, lastReadAt }) => [planId, lastReadAt]),
    );

    const planIds = userPlans.map((p) => p.planId);

    if (planIds.length === 0) {
      return { success: true, message: [] };
    }

    const messages = await db
      .select({
        planId: planMessageTable.planId,
        createdAt: planMessageTable.createdAt,
      })
      .from(planMessageTable)
      .where(inArray(planMessageTable.planId, planIds));

    const unread = messages.reduce((acc, message) => {
      const lastSeen = lastReadMap.get(message.planId);
      if (!lastSeen || message.createdAt > lastSeen) {
        acc.add(message.planId);
      }
      return acc;
    }, new Set<string>());

    return { success: true, message: Array.from(unread) };
  },
  {
    response: SuccessResponse(UnreadPlansSchema),
  },
);
