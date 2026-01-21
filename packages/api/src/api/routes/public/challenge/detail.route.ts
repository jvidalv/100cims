import { and, desc, eq, isNull, or, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import {
  challengeHasMountainTable,
  challengeTable,
  mountainTable,
  summitHasUsersTable,
  summitTable,
  userTable,
} from "@/db/schema";
import {
  SuccessResponse,
  ErrorFieldResponse,
} from "@/api/schemas/common.schema";
import { PublicChallengeDetailSchema } from "@/api/schemas/challenge.schema";

export const detailRoute = new Elysia().get(
  "/detail",
  async ({ query, set }) => {
    // Fetch challenge basic info
    const [challenge] = await db
      .select({
        id: challengeTable.id,
        name: challengeTable.name,
        slug: challengeTable.slug,
        country: challengeTable.country,
        description: challengeTable.description,
        emoji: challengeTable.emoji,
        imageUrl: challengeTable.imageUrl,
        isPublic: challengeTable.isPublic,
        creatorId: challengeTable.creatorId,
      })
      .from(challengeTable)
      .where(
        and(
          eq(challengeTable.id, query.id),
          // Allow official challenges (creatorId IS NULL) OR public community challenges
          or(
            isNull(challengeTable.creatorId),
            eq(challengeTable.isPublic, true),
          ),
        ),
      );

    if (!challenge) {
      set.status = 404;
      return { error: "Challenge not found" };
    }

    const isOfficial = challenge.creatorId === null;

    // Fetch mountains sorted by height (tallest first), limited to first 3
    const mountains = await db
      .select({
        id: mountainTable.id,
        name: mountainTable.name,
        slug: mountainTable.slug,
        location: mountainTable.location,
        height: mountainTable.height,
        imageUrl: mountainTable.imageUrl,
        essential: mountainTable.essential,
      })
      .from(mountainTable)
      .innerJoin(
        challengeHasMountainTable,
        eq(mountainTable.id, challengeHasMountainTable.mountainId),
      )
      .where(eq(challengeHasMountainTable.challengeId, query.id))
      .orderBy(desc(sql`CAST(${mountainTable.height} AS FLOAT)`));

    // Get total mountain count
    const totalMountains = mountains.length;

    // Fetch users who have summited mountains in this challenge, with summit count
    // Run count and list queries in parallel
    const [usersWithSummits, totalUsersResult] = await Promise.all([
      db
        .select({
          id: userTable.id,
          firstName: userTable.firstName,
          lastName: userTable.lastName,
          imageUrl: userTable.imageUrl,
          summitCount: sql<number>`COUNT(DISTINCT ${summitTable.id})`.as(
            "summitCount",
          ),
        })
        .from(userTable)
        .innerJoin(
          summitHasUsersTable,
          eq(userTable.id, summitHasUsersTable.userId),
        )
        .innerJoin(
          summitTable,
          eq(summitHasUsersTable.summitId, summitTable.id),
        )
        .innerJoin(mountainTable, eq(summitTable.mountainId, mountainTable.id))
        .innerJoin(
          challengeHasMountainTable,
          eq(mountainTable.id, challengeHasMountainTable.mountainId),
        )
        .where(
          and(
            eq(challengeHasMountainTable.challengeId, query.id),
            eq(summitTable.validated, true),
          ),
        )
        .groupBy(
          userTable.id,
          userTable.firstName,
          userTable.lastName,
          userTable.imageUrl,
        )
        .orderBy(desc(sql`COUNT(DISTINCT ${summitTable.id})`))
        .limit(100),
      // Count total unique users
      db
        .select({
          count: sql<number>`COUNT(DISTINCT ${userTable.id})`.as("count"),
        })
        .from(userTable)
        .innerJoin(
          summitHasUsersTable,
          eq(userTable.id, summitHasUsersTable.userId),
        )
        .innerJoin(
          summitTable,
          eq(summitHasUsersTable.summitId, summitTable.id),
        )
        .innerJoin(mountainTable, eq(summitTable.mountainId, mountainTable.id))
        .innerJoin(
          challengeHasMountainTable,
          eq(mountainTable.id, challengeHasMountainTable.mountainId),
        )
        .where(
          and(
            eq(challengeHasMountainTable.challengeId, query.id),
            eq(summitTable.validated, true),
          ),
        ),
    ]);

    const totalUsers = Number(totalUsersResult[0]?.count || 0);

    return {
      success: true,
      message: {
        id: challenge.id,
        name: challenge.name,
        slug: challenge.slug,
        country: challenge.country,
        description: challenge.description,
        emoji: challenge.emoji,
        imageUrl: challenge.imageUrl,
        isOfficial,
        isPublic: challenge.isPublic,
        totalMountains,
        totalUsers,
        mountains: mountains.slice(0, 3).map((m) => ({
          id: m.id,
          name: m.name,
          slug: m.slug,
          location: m.location,
          height: m.height,
          imageUrl: m.imageUrl,
          essential: m.essential,
        })),
        users: usersWithSummits.slice(0, 100).map((u) => ({
          id: u.id,
          firstName: u.firstName,
          lastName: u.lastName,
          imageUrl: u.imageUrl,
          summitCount: Number(u.summitCount),
        })),
      },
    };
  },
  {
    query: t.Object({
      id: t.String(),
    }),
    response: {
      200: SuccessResponse(PublicChallengeDetailSchema),
      404: ErrorFieldResponse,
    },
  },
);
