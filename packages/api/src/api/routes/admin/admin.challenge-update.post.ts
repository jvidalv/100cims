import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { challengeTable } from "@/db/schema";
import { AdminChallengeUpdateBodySchema } from "@/api/schemas/admin-challenge.schema";
import {
  ErrorFieldResponse,
  SimpleSuccessResponse,
} from "@/api/schemas/common.schema";

export const adminChallengeUpdatePostRoute = new Elysia().post(
  "/challenges/:id",
  async ({ params, body, set }) => {
    try {
      const [row] = await db
        .update(challengeTable)
        .set(body)
        .where(eq(challengeTable.id, params.id))
        .returning({ id: challengeTable.id });

      if (!row) {
        set.status = 404;
        return { error: "Challenge not found" };
      }
      return { success: true };
    } catch (e) {
      const err = e as { code?: string; constraint?: string };
      if (err.code === "23505") {
        set.status = 409;
        return { error: `Conflict: ${err.constraint ?? "unique constraint"}` };
      }
      throw e;
    }
  },
  {
    params: t.Object({ id: t.String() }),
    body: AdminChallengeUpdateBodySchema,
    response: {
      200: SimpleSuccessResponse,
      404: ErrorFieldResponse,
      409: ErrorFieldResponse,
    },
  },
);
