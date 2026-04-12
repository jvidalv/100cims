import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import {
  challengeHasMountainTable,
  challengeTable,
  userTable,
} from "@/db/schema";
import { creatorNameConcat } from "@/api/routes/@shared/sql-helpers";
import { AdminMountainChallengesResponseSchema } from "@/api/schemas/admin-mountain.schema";
import { SuccessResponse } from "@/api/schemas/common.schema";

export const adminMountainChallengesGetRoute = new Elysia().get(
  "/mountains/:id/challenges",
  async ({ params }) => {
    const rows = await db
      .select({
        id: challengeTable.id,
        name: challengeTable.name,
        slug: challengeTable.slug,
        imageUrl: challengeTable.imageUrl,
        emoji: challengeTable.emoji,
        isPublic: challengeTable.isPublic,
        creatorId: challengeTable.creatorId,
        creatorName: creatorNameConcat(),
      })
      .from(challengeHasMountainTable)
      .innerJoin(
        challengeTable,
        eq(challengeHasMountainTable.challengeId, challengeTable.id),
      )
      .leftJoin(userTable, eq(challengeTable.creatorId, userTable.id))
      .where(eq(challengeHasMountainTable.mountainId, params.id))
      .orderBy(challengeTable.name);

    const items = rows.map(({ creatorId, ...rest }) => ({
      ...rest,
      isOfficial: creatorId === null,
    }));

    return { success: true, message: items };
  },
  {
    params: t.Object({ id: t.String() }),
    response: SuccessResponse(AdminMountainChallengesResponseSchema),
  },
);
