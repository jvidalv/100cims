import { Elysia, t } from "elysia";

import { db } from "@/db";
import { userPlanVisitTable } from "@/db/schema";
import { SimpleSuccessResponse } from "@/api/schemas/common.schema";

export const planCountNewPostRoute = new Elysia().post(
  "/count-new",
  async ({ body }) => {
    await db
      .insert(userPlanVisitTable)
      .values({
        userId: body.userId,
        lastVisitedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userPlanVisitTable.userId,
        set: { lastVisitedAt: new Date() },
      });

    return { success: true };
  },
  {
    body: t.Object({
      userId: t.String(),
    }),
    response: SimpleSuccessResponse,
  },
);
