import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import {
  challengeHasMountainTable,
  mountainTable,
  userTable,
} from "@/db/schema";
import { creatorNameConcat } from "@/api/routes/@shared/sql-helpers";
import { AdminChallengeMountainsResponseSchema } from "@/api/schemas/admin-challenge.schema";
import { SuccessResponse } from "@/api/schemas/common.schema";

export const adminChallengeMountainsGetRoute = new Elysia().get(
  "/challenges/:id/mountains",
  async ({ params }) => {
    const rows = await db
      .select({
        id: mountainTable.id,
        name: mountainTable.name,
        slug: mountainTable.slug,
        location: mountainTable.location,
        height: mountainTable.height,
        imageUrl: mountainTable.imageUrl,
        essential: mountainTable.essential,
        creatorId: mountainTable.creatorId,
        creatorName: creatorNameConcat(),
      })
      .from(challengeHasMountainTable)
      .innerJoin(
        mountainTable,
        eq(challengeHasMountainTable.mountainId, mountainTable.id),
      )
      .leftJoin(userTable, eq(mountainTable.creatorId, userTable.id))
      .where(eq(challengeHasMountainTable.challengeId, params.id))
      .orderBy(mountainTable.name);

    const items = rows.map(({ creatorId, ...rest }) => ({
      ...rest,
      isOfficial: creatorId === null,
    }));

    return { success: true, message: items };
  },
  {
    params: t.Object({ id: t.String() }),
    response: SuccessResponse(AdminChallengeMountainsResponseSchema),
  },
);
