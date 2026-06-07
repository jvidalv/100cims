import { and, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { PLAN_USER_LOG_ACTIONS } from "@/db/enums";
import {
  planHasUsersTable,
  planTable,
  planUserLogTable,
  userTable,
} from "@/db/schema";
import {
  ErrorFieldResponse,
  SimpleSuccessResponse,
} from "@/api/schemas/common.schema";

export const adminPlanCreatorPatchRoute = new Elysia().patch(
  "/plans/:id/creator",
  async ({ params, body, set }) => {
    // Confirm the target user exists up front — `creatorId` is `notNull` with
    // an FK, so a bad id would otherwise surface as a raw 23503 mid-update.
    const [user] = await db
      .select({ id: userTable.id })
      .from(userTable)
      .where(eq(userTable.id, body.userId));
    if (!user) {
      set.status = 404;
      return { error: "User not found" };
    }

    const [plan] = await db
      .update(planTable)
      .set({ creatorId: body.userId, updatedAt: new Date() })
      .where(eq(planTable.id, params.id))
      .returning({ id: planTable.id });
    if (!plan) {
      set.status = 404;
      return { error: "Plan not found" };
    }

    // The creator must also be a participant so the "Creator" badge and member
    // list stay consistent. Upgrade to `organizer` (creators are plan-level
    // admins) — insert if they weren't a member, otherwise bump their role.
    const [inserted] = await db
      .insert(planHasUsersTable)
      .values({ planId: params.id, userId: body.userId, role: "organizer" })
      .onConflictDoNothing()
      .returning({ id: planHasUsersTable.id });

    if (inserted) {
      // Newly added as a member → record the join, mirroring member-add.
      await db.insert(planUserLogTable).values({
        planId: params.id,
        userId: body.userId,
        action: PLAN_USER_LOG_ACTIONS.JOINED,
      });
    } else {
      await db
        .update(planHasUsersTable)
        .set({ role: "organizer" })
        .where(
          and(
            eq(planHasUsersTable.planId, params.id),
            eq(planHasUsersTable.userId, body.userId),
          ),
        );
    }

    return { success: true };
  },
  {
    params: t.Object({ id: t.String() }),
    body: t.Object({ userId: t.String() }),
    response: {
      200: SimpleSuccessResponse,
      404: ErrorFieldResponse,
    },
  },
);
