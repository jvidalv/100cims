import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { challengeTable, userTable } from "@/db/schema";
import { DEFAULT_CHALLENGE_ID } from "@/api/routes/@shared/challenge";
import { getUserFromRequest } from "@/api/routes/@shared/auth";
import { ErrorFieldResponse } from "@/api/schemas/common.schema";

export const challengeDeletePostRoute = new Elysia().post(
  "/delete",
  async ({ body, request, set }) => {
    const user = getUserFromRequest(request);

    // Check if challenge exists and user is the creator
    const existing = await db
      .select({
        id: challengeTable.id,
        creatorId: challengeTable.creatorId,
      })
      .from(challengeTable)
      .where(eq(challengeTable.id, body.id))
      .limit(1);

    if (!existing.length) {
      set.status = 404;
      return { error: "Challenge not found" };
    }

    if (existing[0].creatorId !== user.id) {
      set.status = 403;
      return { error: "Not authorized to delete this challenge" };
    }

    // Update all users who have this challenge as active to use the default challenge
    await db
      .update(userTable)
      .set({ activeChallengeId: DEFAULT_CHALLENGE_ID })
      .where(eq(userTable.activeChallengeId, body.id));

    await db.delete(challengeTable).where(eq(challengeTable.id, body.id));

    return {
      success: true,
      message: "Challenge deleted successfully",
    };
  },
  {
    body: t.Object({
      id: t.String(),
    }),
    response: {
      200: t.Object({
        success: t.Boolean(),
        message: t.String(),
      }),
      403: ErrorFieldResponse,
      404: ErrorFieldResponse,
    },
  },
);
