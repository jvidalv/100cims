import { and, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { planHasMountainsTable } from "@/db/schema";
import {
  ErrorFieldResponse,
  SimpleSuccessResponse,
} from "@/api/schemas/common.schema";

export const adminPlanMountainRemoveDeleteRoute = new Elysia().delete(
  "/plans/:id/mountains/:mountainId",
  async ({ params, set }) => {
    const [row] = await db
      .delete(planHasMountainsTable)
      .where(
        and(
          eq(planHasMountainsTable.planId, params.id),
          eq(planHasMountainsTable.mountainId, params.mountainId),
        ),
      )
      .returning({ id: planHasMountainsTable.id });

    if (!row) {
      set.status = 404;
      return { error: "Plan mountain not found" };
    }

    return { success: true };
  },
  {
    params: t.Object({ id: t.String(), mountainId: t.String() }),
    response: {
      200: SimpleSuccessResponse,
      404: ErrorFieldResponse,
    },
  },
);
