import { and, eq, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import {
  challengeHasMountainTable,
  mountainTable,
  summitHasUsersTable,
  summitTable,
  userTable,
} from "@/db/schema";
import { resolveChallengeId } from "@/api/routes/@shared/challenge";
import { JWT } from "@/api/routes/@shared/jwt";
import {
  getBearerToken,
  getOptionalUser,
} from "@/api/routes/@shared/optional-auth";
import { SuccessResponse } from "@/api/schemas/common.schema";
import { HiscoresAroundMeResponseSchema } from "@/api/schemas/hiscores.schema";

const DEFAULT_WINDOW = 10;
const MAX_WINDOW = 25;

export const hiscoresAroundMeGetRoute = new Elysia().use(JWT()).get(
  "/around-me",
  async ({ query, jwt, headers, set }) => {
    const optionalUser = await getOptionalUser(jwt, getBearerToken(headers));
    if (!optionalUser) {
      set.status = 401;
      return { error: "Authentication required" };
    }

    const challengeId = resolveChallengeId(query.challengeId, optionalUser);
    const window = Math.min(query.window ?? DEFAULT_WINDOW, MAX_WINDOW);

    // Full ranked set for this challenge (all visible users who've summited).
    // RANK() so ties share a rank; ties happen at the long tail.
    const rankedSet = db.$with("ranked_set").as(
      db
        .select({
          userId: userTable.id,
          firstName: userTable.firstName,
          lastName: userTable.lastName,
          imageUrl: userTable.imageUrl,
          summitsCount: sql<string>`COUNT(${summitHasUsersTable.summitId})`.as(
            "summitsCount",
          ),
          uniquePeaksCount:
            sql<string>`COUNT(DISTINCT ${summitTable.mountainId})`.as(
              "uniquePeaksCount",
            ),
          essentialPeaksCount:
            sql<string>`COUNT(DISTINCT CASE WHEN ${mountainTable.essential} THEN ${summitTable.mountainId} ELSE NULL END)`.as(
              "essentialPeaksCount",
            ),
          totalScore: sql<number>`SUM(
            (CAST(${mountainTable.height} AS FLOAT) / 10) *
            CASE WHEN ${mountainTable.essential} THEN 2 ELSE 1 END
          )`.as("totalScore"),
          rank: sql<number>`RANK() OVER (ORDER BY SUM(
            (CAST(${mountainTable.height} AS FLOAT) / 10) *
            CASE WHEN ${mountainTable.essential} THEN 2 ELSE 1 END
          ) DESC)`.as("rank"),
        })
        .from(userTable)
        .leftJoin(
          summitHasUsersTable,
          eq(userTable.id, summitHasUsersTable.userId),
        )
        .leftJoin(summitTable, eq(summitHasUsersTable.summitId, summitTable.id))
        .leftJoin(mountainTable, eq(summitTable.mountainId, mountainTable.id))
        .leftJoin(
          challengeHasMountainTable,
          eq(mountainTable.id, challengeHasMountainTable.mountainId),
        )
        .where(
          and(
            eq(summitTable.validated, true),
            eq(userTable.visibleOnHiscores, true),
            eq(challengeHasMountainTable.challengeId, challengeId),
          ),
        )
        .groupBy(
          userTable.id,
          userTable.firstName,
          userTable.lastName,
          userTable.imageUrl,
        ),
    );

    // Find my rank first.
    const [mine] = await db
      .with(rankedSet)
      .select({ rank: rankedSet.rank })
      .from(rankedSet)
      .where(eq(rankedSet.userId, optionalUser.id))
      .limit(1);

    if (!mine) {
      // User has no summits for this challenge / not in the ranked set.
      // Return empty window but still report totalRanked for completeness.
      const [total] = await db
        .with(rankedSet)
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(rankedSet);
      return {
        success: true,
        message: {
          myRank: null,
          totalRanked: Number(total?.count ?? 0),
          items: [],
        },
      };
    }

    const myRank = Number(mine.rank);
    const lowRank = Math.max(1, myRank - window);
    const highRank = myRank + window;

    const [windowRows, totalRow] = await Promise.all([
      db
        .with(rankedSet)
        .select()
        .from(rankedSet)
        .where(
          and(
            sql`${rankedSet.rank} >= ${lowRank}`,
            sql`${rankedSet.rank} <= ${highRank}`,
          ),
        )
        .orderBy(rankedSet.rank),
      db
        .with(rankedSet)
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(rankedSet),
    ]);

    return {
      success: true,
      message: {
        myRank,
        totalRanked: Number(totalRow[0]?.count ?? 0),
        items: windowRows.map((r) => ({
          rank: Number(r.rank),
          userId: r.userId,
          firstName: r.firstName,
          lastName: r.lastName,
          imageUrl: r.imageUrl,
          summitsCount: r.summitsCount,
          uniquePeaksCount: r.uniquePeaksCount,
          essentialPeaksCount: r.essentialPeaksCount,
          totalScore: Number(r.totalScore),
        })),
      },
    };
  },
  {
    query: t.Object({
      challengeId: t.Optional(t.String()),
      window: t.Optional(t.Number()),
    }),
    response: {
      200: SuccessResponse(HiscoresAroundMeResponseSchema),
      401: t.Object({ error: t.String() }),
    },
  },
);
