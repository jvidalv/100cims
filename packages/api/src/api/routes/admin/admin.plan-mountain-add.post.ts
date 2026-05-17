import { Elysia, t } from "elysia";

import { db } from "@/db";
import { planHasMountainsTable } from "@/db/schema";
import {
  ErrorFieldResponse,
  SimpleSuccessResponse,
} from "@/api/schemas/common.schema";

export const adminPlanMountainAddPostRoute = new Elysia().post(
  "/plans/:id/mountains/:mountainId",
  async ({ params, set }) => {
    try {
      await db
        .insert(planHasMountainsTable)
        .values({ planId: params.id, mountainId: params.mountainId })
        .onConflictDoNothing();
    } catch (e) {
      // Postgres foreign-key violation → either the plan or the mountain id
      // doesn't exist. The unique index already takes care of duplicates via
      // onConflictDoNothing above.
      if ((e as { code?: string }).code === "23503") {
        set.status = 404;
        return { error: "Plan or mountain not found" };
      }
      throw e;
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
