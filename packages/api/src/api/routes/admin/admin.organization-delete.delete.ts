import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { organizationTable } from "@/db/schema";
import {
  ErrorFieldResponse,
  SimpleSuccessResponse,
} from "@/api/schemas/common.schema";

export const adminOrganizationDeleteDeleteRoute = new Elysia().delete(
  "/organizations/:id",
  async ({ params, set }) => {
    const [existing] = await db
      .select({ id: organizationTable.id })
      .from(organizationTable)
      .where(eq(organizationTable.id, params.id));

    if (!existing) {
      set.status = 404;
      return { error: "Organization not found" };
    }

    // `organization_member` rows cascade-delete; `plan.organization_id`
    // is set-null per the FK clause, so deleting an org orphans its plans
    // without affecting them otherwise.
    await db
      .delete(organizationTable)
      .where(eq(organizationTable.id, params.id));
    return { success: true };
  },
  {
    params: t.Object({ id: t.String() }),
    response: {
      200: SimpleSuccessResponse,
      404: ErrorFieldResponse,
    },
  },
);
