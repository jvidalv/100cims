import { and, desc, eq, isNotNull, or, sql } from "drizzle-orm";
import { Elysia } from "elysia";

import { db } from "@/db";
import {
  challengeHasMountainTable,
  challengeTable,
  mountainTable,
  summitTable,
  summitHasUsersTable,
} from "@/db/schema";
import { getUserFromRequest } from "@/api/routes/@shared/auth";
import { SuccessResponse } from "@/api/schemas/common.schema";
import {
  CommunityChallengesArraySchema,
  ListCommunityChallengesQuery,
} from "@/api/schemas/community-challenge.schema";

export const challengeListGetRoute = new Elysia().get(
  "/list",
  async ({ query, request }) => {
    const user = getUserFromRequest(request);
    const filter = query.filter;

    // Build where clause based on filter
    // Only show community challenges (creatorId IS NOT NULL)
    let whereClause;
    if (filter === "mine") {
      whereClause = eq(challengeTable.creatorId, user.id);
    } else if (filter === "public") {
      whereClause = and(
        isNotNull(challengeTable.creatorId),
        eq(challengeTable.isPublic, true),
      );
    } else {
      // Default: show user's own + public community challenges
      whereClause = and(
        isNotNull(challengeTable.creatorId),
        or(
          eq(challengeTable.creatorId, user.id),
          eq(challengeTable.isPublic, true),
        ),
      );
    }

    const challenges = await db
      .select({
        id: challengeTable.id,
        name: challengeTable.name,
        slug: challengeTable.slug,
        description: challengeTable.description,
        country: challengeTable.country,
        imageUrl: challengeTable.imageUrl,
        emoji: challengeTable.emoji,
        isPublic: challengeTable.isPublic,
        creatorId: challengeTable.creatorId,
        createdAt: challengeTable.createdAt,
        totalMountains: sql<string>`COUNT(DISTINCT ${challengeHasMountainTable.mountainId})`,
        totalUsers: sql<string>`COUNT(DISTINCT COALESCE(${summitHasUsersTable.userId}, ${summitTable.userId}))`,
        peakImageUrl: sql<string | null>`(
          SELECT ${mountainTable.imageUrl}
          FROM ${mountainTable}
          INNER JOIN ${challengeHasMountainTable}
            ON ${challengeHasMountainTable.mountainId} = ${mountainTable.id}
          WHERE ${challengeHasMountainTable.challengeId} = ${challengeTable.id}
            AND ${mountainTable.essential} = TRUE
            AND ${mountainTable.imageUrl} IS NOT NULL
          ORDER BY CAST(${mountainTable.height} AS FLOAT) DESC
          LIMIT 1
        )`,
      })
      .from(challengeTable)
      .leftJoin(
        challengeHasMountainTable,
        eq(challengeTable.id, challengeHasMountainTable.challengeId),
      )
      .leftJoin(
        mountainTable,
        eq(challengeHasMountainTable.mountainId, mountainTable.id),
      )
      .leftJoin(summitTable, eq(mountainTable.id, summitTable.mountainId))
      .leftJoin(
        summitHasUsersTable,
        eq(summitTable.id, summitHasUsersTable.summitId),
      )
      .where(whereClause)
      .groupBy(challengeTable.id)
      .orderBy(
        desc(
          sql`COUNT(DISTINCT COALESCE(${summitHasUsersTable.userId}, ${summitTable.userId}))`,
        ),
        desc(challengeTable.createdAt),
      );

    return {
      success: true,
      message: challenges.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        country: c.country,
        imageUrl: c.imageUrl,
        emoji: c.emoji,
        isPublic: c.isPublic,
        creatorId: c.creatorId,
        totalMountains: c.totalMountains,
        totalUsers: c.totalUsers,
        createdAt: c.createdAt.toISOString(),
        peakImageUrl: c.peakImageUrl,
      })),
    };
  },
  {
    query: ListCommunityChallengesQuery,
    response: SuccessResponse(CommunityChallengesArraySchema),
  },
);
