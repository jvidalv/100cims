import { and, eq, isNotNull } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { challengeTable } from "@/db/schema";
import {
  ErrorFieldResponse,
  SimpleSuccessResponse,
} from "@/api/schemas/common.schema";

export const adminChallengeDeleteRoute = new Elysia().delete(
  "/challenges/:id",
  async ({ params, set }) => {
    const [deleted] = await db
      .delete(challengeTable)
      .where(
        and(
          eq(challengeTable.id, params.id),
          isNotNull(challengeTable.creatorId),
        ),
      )
      .returning({ id: challengeTable.id });

    if (deleted) return { success: true };

    const [exists] = await db
      .select({ id: challengeTable.id })
      .from(challengeTable)
      .where(eq(challengeTable.id, params.id));

    if (!exists) {
      set.status = 404;
      return { error: "Challenge not found" };
    }
    set.status = 403;
    return { error: "Cannot delete official challenges" };
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
