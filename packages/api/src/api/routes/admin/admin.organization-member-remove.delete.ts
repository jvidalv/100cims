import { and, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { organizationMemberTable } from "@/db/schema";
import {
  ErrorFieldResponse,
  SimpleSuccessResponse,
} from "@/api/schemas/common.schema";

export const adminOrganizationMemberRemoveDeleteRoute = new Elysia().delete(
  "/organizations/:id/members/:userId",
  async ({ params, set }) => {
    const [deleted] = await db
      .delete(organizationMemberTable)
      .where(
        and(
          eq(organizationMemberTable.organizationId, params.id),
          eq(organizationMemberTable.userId, params.userId),
        ),
      )
      .returning({ id: organizationMemberTable.id });

    if (!deleted) {
      set.status = 404;
      return { error: "Membership not found" };
    }
    return { success: true };
  },
  {
    params: t.Object({ id: t.String(), userId: t.String() }),
    response: {
      200: SimpleSuccessResponse,
      404: ErrorFieldResponse,
    },
  },
);
