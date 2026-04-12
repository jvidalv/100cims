import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import {
  challengeHasMountainTable,
  challengeTable,
  mountainTable,
  summitHasUsersTable,
  summitTable,
} from "@/db/schema";
import { SuccessResponse } from "@/api/schemas/common.schema";
import { UserChallengesArraySchema } from "@/api/schemas/user.schema";

export const userChallengesGetRoute = new Elysia().get(
  "/challenges",
  async ({ query }) => {
    const userId = query.userId;

    const results = await db
      .select({
        id: challengeTable.id,
        name: challengeTable.name,
        slug: challengeTable.slug,
        country: challengeTable.country,
        emoji: challengeTable.emoji,
        imageUrl: challengeTable.imageUrl,
        summitCount: sql<number>`COUNT(DISTINCT ${summitTable.id})`.as(
          "summitCount",
        ),
      })
      .from(summitHasUsersTable)
      .innerJoin(
        summitTable,
        eq(summitHasUsersTable.summitId, summitTable.id),
      )
      .innerJoin(mountainTable, eq(summitTable.mountainId, mountainTable.id))
      .innerJoin(
        challengeHasMountainTable,
        eq(mountainTable.id, challengeHasMountainTable.mountainId),
      )
      .innerJoin(
        challengeTable,
        eq(challengeHasMountainTable.challengeId, challengeTable.id),
      )
      .where(
        and(
          eq(summitHasUsersTable.userId, userId),
          isNull(challengeTable.creatorId),
        ),
      )
      .groupBy(
        challengeTable.id,
        challengeTable.name,
        challengeTable.slug,
        challengeTable.country,
        challengeTable.emoji,
        challengeTable.imageUrl,
      )
      .orderBy(desc(sql`COUNT(DISTINCT ${summitTable.id})`));

    const challenges = results.map((challenge) => ({
      id: challenge.id,
      name: challenge.name,
      slug: challenge.slug,
      country: challenge.country,
      emoji: challenge.emoji,
      imageUrl: challenge.imageUrl,
      isOfficial: true,
      summitCount: Number(challenge.summitCount),
    }));

    return {
      success: true,
      message: challenges,
    };
  },
  {
    query: t.Object({
      userId: t.String(),
    }),
    response: SuccessResponse(UserChallengesArraySchema),
  },
);
