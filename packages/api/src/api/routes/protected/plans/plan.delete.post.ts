import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { planTable } from "@/db/schema";
import { getUserFromRequest } from "@/api/routes/@shared/auth";

export const planDeletePostRoute = new Elysia().post(
  "/delete",
  async ({ body, request }) => {
    const user = getUserFromRequest(request);

    const existing = await db
      .select({ creatorId: planTable.creatorId })
      .from(planTable)
      .where(eq(planTable.id, body.id))
      .limit(1);

    if (!existing.length || existing[0].creatorId !== user.id) {
      return {
        success: false,
        message: "Not authorized to delete this plan",
      };
    }

    await db.delete(planTable).where(eq(planTable.id, body.id));

    return { success: true, message: "Plan deleted successfully" };
  },
  {
    body: t.Object({
      id: t.String(),
    }),
    response: t.Object({
      success: t.Boolean(),
      message: t.String(),
    }),
  },
);
