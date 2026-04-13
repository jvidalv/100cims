import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { challengeTable } from "@/db/schema";
import {
  ErrorFieldResponse,
  SimpleSuccessResponse,
} from "@/api/schemas/common.schema";

export const adminChallengeDeleteDeleteRoute = new Elysia().delete(
  "/challenges/:id",
  async ({ params, set }) => {
    const [existing] = await db
      .select({ creatorId: challengeTable.creatorId })
      .from(challengeTable)
      .where(eq(challengeTable.id, params.id));

    if (!existing) {
      set.status = 404;
      return { error: "Challenge not found" };
    }

    if (existing.creatorId === null) {
      set.status = 403;
      return { error: "Cannot delete official challenges" };
    }

    await db.delete(challengeTable).where(eq(challengeTable.id, params.id));
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
