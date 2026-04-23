import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { mountainRatingTable } from "@/db/schema";
import { recalcMountainRatingAggregates } from "@/api/lib/mountain-ratings";
import {
  ErrorFieldResponse,
  SimpleSuccessResponse,
} from "@/api/schemas/common.schema";

export const adminMountainRatingDeleteDeleteRoute = new Elysia().delete(
  "/mountain-ratings/:id",
  async ({ params, set }) => {
    const affectedMountainId = await db.transaction(async (tx) => {
      const [row] = await tx
        .delete(mountainRatingTable)
        .where(eq(mountainRatingTable.id, params.id))
        .returning({ mountainId: mountainRatingTable.mountainId });

      if (!row) return null;
      await recalcMountainRatingAggregates(row.mountainId, tx);
      return row.mountainId;
    });

    if (!affectedMountainId) {
      set.status = 404;
      return { error: "Rating not found" };
    }
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
