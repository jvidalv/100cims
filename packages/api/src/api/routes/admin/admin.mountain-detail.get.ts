import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { mountainTable, userTable } from "@/db/schema";
import { creatorNameConcat } from "@/api/routes/@shared/sql-helpers";
import { AdminMountainDetailSchema } from "@/api/schemas/admin-mountain.schema";
import {
  ErrorFieldResponse,
  SuccessResponse,
} from "@/api/schemas/common.schema";

export const adminMountainDetailGetRoute = new Elysia().get(
  "/mountains/:id",
  async ({ params, set }) => {
    const [row] = await db
      .select({
        id: mountainTable.id,
        name: mountainTable.name,
        slug: mountainTable.slug,
        location: mountainTable.location,
        essential: mountainTable.essential,
        height: mountainTable.height,
        latitude: mountainTable.latitude,
        longitude: mountainTable.longitude,
        url: mountainTable.url,
        imageUrl: mountainTable.imageUrl,
        creatorId: mountainTable.creatorId,
        creatorName: creatorNameConcat(),
        createdAt: mountainTable.createdAt,
        avgFamilyFriendly: mountainTable.avgFamilyFriendly,
        familyRatingCount: mountainTable.familyRatingCount,
        avgDogFriendly: mountainTable.avgDogFriendly,
        dogRatingCount: mountainTable.dogRatingCount,
        avgDifficulty: mountainTable.avgDifficulty,
        difficultyRatingCount: mountainTable.difficultyRatingCount,
      })
      .from(mountainTable)
      .leftJoin(userTable, eq(mountainTable.creatorId, userTable.id))
      .where(eq(mountainTable.id, params.id));

    if (!row) {
      set.status = 404;
      return { error: "Mountain not found" };
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
      200: SuccessResponse(AdminMountainDetailSchema),
      404: ErrorFieldResponse,
    },
  },
);
