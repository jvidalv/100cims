import { eq, sql, count } from "drizzle-orm";
import { Elysia } from "elysia";

import { db } from "@/db";
import { mountainTable, challengeHasMountainTable } from "@/db/schema";
import { getUserFromRequest } from "@/api/routes/@shared/auth";
import { SuccessResponse } from "@/api/schemas/common.schema";
import { MyMountainsArraySchema } from "@/api/schemas/mountain.schema";

export const mountainMyListGetRoute = new Elysia().get(
  "/my-list",
  async ({ request }) => {
    const user = getUserFromRequest(request);

    const mountains = await db
      .select({
        id: mountainTable.id,
        name: mountainTable.name,
        slug: mountainTable.slug,
        location: mountainTable.location,
        height: mountainTable.height,
        latitude: mountainTable.latitude,
        longitude: mountainTable.longitude,
        imageUrl: mountainTable.imageUrl,
        essential: mountainTable.essential,
        challengeCount: count(challengeHasMountainTable.id),
      })
      .from(mountainTable)
      .leftJoin(
        challengeHasMountainTable,
        eq(mountainTable.id, challengeHasMountainTable.mountainId),
      )
      .where(eq(mountainTable.creatorId, user.id))
      .groupBy(mountainTable.id)
      .orderBy(sql`${mountainTable.createdAt} DESC`);

    return {
      success: true,
      message: mountains.map((m) => ({
        id: m.id,
        name: m.name,
        slug: m.slug,
        location: m.location,
        height: m.height,
        latitude: m.latitude,
        longitude: m.longitude,
        imageUrl: m.imageUrl,
        essential: m.essential,
        challengeCount: m.challengeCount,
      })),
    };
  },
  {
    response: {
      200: SuccessResponse(MyMountainsArraySchema),
    },
  },
);
