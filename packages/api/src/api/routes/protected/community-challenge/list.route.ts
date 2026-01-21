import { and, count, desc, eq, isNotNull, or, sql } from "drizzle-orm";
import { Elysia } from "elysia";

import { db } from "@/db";
import {
  challengeHasMountainTable,
  challengeTable,
  mountainTable,
  summitTable,
  summitHasUsersTable,
} from "@/db/schema";
import { JWT } from "@/api/routes/@shared/jwt";
import { getStoreUser } from "@/api/routes/@shared/store";
import { SuccessResponse } from "@/api/schemas/common.schema";
import {
  CommunityChallengesArraySchema,
  ListCommunityChallengesQuery,
} from "@/api/schemas/community-challenge.schema";

export const listRoute = new Elysia()
  .use(JWT())
  .get(
    "/list",
    async ({ query, store }) => {
      const user = getStoreUser(store);
      const filter = query.filter;

      // Build where clause based on filter
      // Only show community challenges (creatorId IS NOT NULL)
      let whereClause;
      if (filter === "mine") {
        whereClause = eq(challengeTable.creatorId, user.id);
      } else if (filter === "public") {
        whereClause = and(
          isNotNull(challengeTable.creatorId),
          eq(challengeTable.isPublic, true)
        );
      } else {
        // Default: show user's own + public community challenges
        whereClause = and(
          isNotNull(challengeTable.creatorId),
          or(
            eq(challengeTable.creatorId, user.id),
            eq(challengeTable.isPublic, true)
          )
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
        })
        .from(challengeTable)
        .leftJoin(
          challengeHasMountainTable,
          eq(challengeTable.id, challengeHasMountainTable.challengeId)
        )
        .leftJoin(
          mountainTable,
          eq(challengeHasMountainTable.mountainId, mountainTable.id)
        )
        .leftJoin(
          summitTable,
          eq(mountainTable.id, summitTable.mountainId)
        )
        .leftJoin(
          summitHasUsersTable,
          eq(summitTable.id, summitHasUsersTable.summitId)
        )
        .where(whereClause)
        .groupBy(challengeTable.id)
        .orderBy(desc(challengeTable.createdAt));

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
        })),
      };
    },
    {
      query: ListCommunityChallengesQuery,
      response: SuccessResponse(CommunityChallengesArraySchema),
    }
  );
