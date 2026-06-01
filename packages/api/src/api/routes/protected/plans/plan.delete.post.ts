import { and, eq, ne } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { planHasUsersTable, planTable } from "@/db/schema";
import { sendPushLocalized } from "@/api/lib/push";
import { PUSH_TYPE } from "@/api/lib/push-types";
import { pushPlanDeleted } from "@/api/lib/push-translations";
import { getUserFromRequest } from "@/api/routes/@shared/auth";

export const planDeletePostRoute = new Elysia().post(
  "/delete",
  async ({ body, request }) => {
    const user = getUserFromRequest(request);

    const existing = await db
      .select({ creatorId: planTable.creatorId, title: planTable.title })
      .from(planTable)
      .where(eq(planTable.id, body.id))
      .limit(1);

    if (!existing.length || existing[0].creatorId !== user.id) {
      return {
        success: false,
        message: "Not authorized to delete this plan",
      };
    }

    // Capture the participant set before the row disappears. Skip the
    // creator — they triggered the action, no need to notify themselves.
    const participants = await db
      .select({ userId: planHasUsersTable.userId })
      .from(planHasUsersTable)
      .where(
        and(
          eq(planHasUsersTable.planId, body.id),
          ne(planHasUsersTable.userId, user.id),
        ),
      );

    await db.delete(planTable).where(eq(planTable.id, body.id));

    if (participants.length) {
      void sendPushLocalized(
        participants.map((p) => p.userId),
        (locale) => ({
          title: existing[0].title,
          body: pushPlanDeleted(locale),
        }),
        // The plan is gone; the client routes this push to /plans rather
        // than the now-404 /plan/:id.
        { type: PUSH_TYPE.PLAN_DELETED },
      );
    }

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
