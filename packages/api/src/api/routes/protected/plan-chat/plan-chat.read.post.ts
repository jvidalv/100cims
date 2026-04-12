import { and, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { planUserMessageReadTable } from "@/db/schema";
import { getUserFromRequest } from "@/api/routes/@shared/auth";
import { SimpleSuccessResponse } from "@/api/schemas/common.schema";

export const planChatReadPostRoute = new Elysia().post(
  "/read",
  async ({ body, request }) => {
    const user = getUserFromRequest(request);

    const exists = await db
      .select({ id: planUserMessageReadTable.id })
      .from(planUserMessageReadTable)
      .where(
        and(
          eq(planUserMessageReadTable.planId, body.planId),
          eq(planUserMessageReadTable.userId, user.id),
        ),
      )
      .limit(1);

    if (exists.length) {
      await db
        .update(planUserMessageReadTable)
        .set({ lastReadAt: new Date() })
        .where(eq(planUserMessageReadTable.id, exists[0].id));
    } else {
      await db.insert(planUserMessageReadTable).values({
        userId: user.id,
        planId: body.planId,
        lastReadAt: new Date(),
      });
    }

    return { success: true };
  },
  {
    body: t.Object({
      planId: t.String(),
    }),
    response: SimpleSuccessResponse,
  },
);
