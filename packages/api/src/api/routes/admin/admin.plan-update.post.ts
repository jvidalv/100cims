import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { planTable } from "@/db/schema";
import { AdminPlanUpdateBodySchema } from "@/api/schemas/admin.schema";
import {
  ErrorFieldResponse,
  SimpleSuccessResponse,
} from "@/api/schemas/common.schema";

export const adminPlanUpdatePostRoute = new Elysia().post(
  "/plans/:id",
  async ({ params, body, set }) => {
    const [row] = await db
      .update(planTable)
      .set({ ...body, updatedAt: new Date() })
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
    body: AdminPlanUpdateBodySchema,
    response: {
      200: SimpleSuccessResponse,
      404: ErrorFieldResponse,
    },
  },
);
