import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { planTable } from "@/db/schema";
import {
  ErrorFieldResponse,
  SimpleSuccessResponse,
} from "@/api/schemas/common.schema";

export const adminPlanDeleteRoute = new Elysia().delete(
  "/plans/:id",
  async ({ params, set }) => {
    const [row] = await db
      .delete(planTable)
      .where(eq(planTable.id, params.id))
      .returning({ id: planTable.id });

    if (!row) {
      set.status = 404;
      return { error: "Plan not found" };
    }
    return { success: true };
  },
  {
    params: t.Object({ id: t.String() }),
    response: {
      200: SimpleSuccessResponse,
      403: ErrorFieldResponse,
      404: ErrorFieldResponse,
    },
  },
);
