import { and, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { planHasUsersTable } from "@/db/schema";
import { AdminPlanMemberRoleBodySchema } from "@/api/schemas/admin-organization.schema";
import {
  ErrorFieldResponse,
  SimpleSuccessResponse,
} from "@/api/schemas/common.schema";

export const adminPlanMemberRolePatchRoute = new Elysia().patch(
  "/plans/:id/members/:userId/role",
  async ({ params, body, set }) => {
    const [updated] = await db
      .update(planHasUsersTable)
      .set({ role: body.role })
      .where(
        and(
          eq(planHasUsersTable.planId, params.id),
          eq(planHasUsersTable.userId, params.userId),
        ),
      )
      .returning({ id: planHasUsersTable.id });

    if (!updated) {
      set.status = 404;
      return { error: "Membership not found" };
    }
    return { success: true };
  },
  {
    params: t.Object({ id: t.String(), userId: t.String() }),
    body: AdminPlanMemberRoleBodySchema,
    response: {
      200: SimpleSuccessResponse,
      404: ErrorFieldResponse,
    },
  },
);
