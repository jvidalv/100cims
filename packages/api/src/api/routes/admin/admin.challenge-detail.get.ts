import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { challengeTable, userTable } from "@/db/schema";
import { creatorNameConcat } from "@/api/routes/@shared/sql-helpers";
import { AdminChallengeDetailSchema } from "@/api/schemas/admin-challenge.schema";
import {
  ErrorFieldResponse,
  SuccessResponse,
} from "@/api/schemas/common.schema";

export const adminChallengeDetailGetRoute = new Elysia().get(
  "/challenges/:id",
  async ({ params, set }) => {
    const [row] = await db
      .select({
        id: challengeTable.id,
        name: challengeTable.name,
        slug: challengeTable.slug,
        country: challengeTable.country,
        description: challengeTable.description,
        emoji: challengeTable.emoji,
        imageUrl: challengeTable.imageUrl,
        webUrl: challengeTable.webUrl,
        isPublic: challengeTable.isPublic,
        creatorId: challengeTable.creatorId,
        creatorName: creatorNameConcat(),
        createdAt: challengeTable.createdAt,
      })
      .from(challengeTable)
      .leftJoin(userTable, eq(challengeTable.creatorId, userTable.id))
      .where(eq(challengeTable.id, params.id));

    if (!row) {
      set.status = 404;
      return { error: "Challenge not found" };
    }

    const { creatorId, ...rest } = row;
    return {
      success: true,
      message: { ...rest, isOfficial: creatorId === null },
    };
  },
  {
    params: t.Object({ id: t.String() }),
    response: {
      200: SuccessResponse(AdminChallengeDetailSchema),
      404: ErrorFieldResponse,
    },
  },
);
