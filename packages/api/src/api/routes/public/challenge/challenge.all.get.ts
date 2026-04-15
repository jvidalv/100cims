import { eq, isNull, sql } from "drizzle-orm";
import { Elysia } from "elysia";

import { db } from "@/db";
import {
  challengeHasMountainTable,
  challengeTable,
  mountainTable,
  summitHasUsersTable,
  summitTable,
} from "@/db/schema";
import { SuccessResponse } from "@/api/schemas/common.schema";
import { ChallengesArraySchema } from "@/api/schemas/challenge.schema";

export const challengeAllGetRoute = new Elysia().get(
  "/all",
  async () => {
    const challengesWithCounts = await db
      .select({
        id: challengeTable.id,
        name: challengeTable.name,
        slug: challengeTable.slug,
        country: challengeTable.country,
        totalMountains: sql<string>`COUNT(DISTINCT ${challengeHasMountainTable.mountainId})`,
        totalEssentialMountains: sql<string>`COUNT(DISTINCT CASE WHEN ${mountainTable.essential} THEN ${mountainTable.id} ELSE NULL END)`,
        // Count users from both summit.userId and summitHasUsers.userId
        totalUsers: sql<string>`COUNT(DISTINCT COALESCE(${summitHasUsersTable.userId}, ${summitTable.userId}))`,
        // Image of the tallest essential mountain in the challenge, if any.
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
      // Only return official challenges (creatorId IS NULL) for backwards compatibility
      .where(isNull(challengeTable.creatorId))
      .groupBy(challengeTable.id, challengeTable.slug);

    const sorted = challengesWithCounts.sort(
      (a, b) => Number(b.totalUsers) - Number(a.totalUsers),
    );

    return {
      success: true,
      message: sorted,
    };
  },
  {
    response: SuccessResponse(ChallengesArraySchema),
  },
);
