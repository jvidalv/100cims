import { and, count, desc, eq, sql } from "drizzle-orm";
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
import { HiscoresResponseSchema } from "@/api/schemas/hiscores.schema";

const DEFAULT_PAGE_SIZE = 50;

export const hiscoresAllGetRoute = new Elysia().use(JWT()).get(
  "/all",
  async ({ query, jwt, headers }) => {
    const optionalUser = await getOptionalUser(jwt, getBearerToken(headers));
    // Priority: query.challengeId > user.activeChallengeId > DEFAULT_CHALLENGE_ID
    const challengeId = resolveChallengeId(query.challengeId, optionalUser);

    // Pagination is only applied when page or limit is explicitly provided
    const isPaginated = query.page !== undefined || query.limit !== undefined;
    const page = query.page ?? 1;
    const pageSize = query.limit ?? DEFAULT_PAGE_SIZE;
    const offset = (page - 1) * pageSize;

    const whereCondition = and(
      eq(summitTable.validated, true),
      eq(userTable.visibleOnHiscores, true),
      eq(challengeHasMountainTable.challengeId, challengeId),
    );

    const baseQuery = db
      .select({
        userId: userTable.id,
        firstName: userTable.firstName,
        lastName: userTable.lastName,
        imageUrl: userTable.imageUrl,
        summitsCount: sql<string>`COUNT
            (${summitHasUsersTable.summitId})`.as("summitsCount"),
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
      .where(whereCondition)
      .groupBy(
        userTable.id,
        userTable.username,
        userTable.firstName,
        userTable.lastName,
        userTable.imageUrl,
      )
      .orderBy(
        desc(
          sql`SUM((CAST(${mountainTable.height} AS FLOAT) / 10) *CASE WHEN ${mountainTable.essential} THEN 2 ELSE 1 END)`,
        ),
      );

    // If paginated, run count query in parallel; otherwise just get all results
    if (isPaginated) {
      // Compute the authed user's rank alongside the count + page. Uses RANK()
      // so ties share a rank. Only runs when we have an authed user — otherwise
      // we don't populate myRank at all (Promise.resolve passthrough).
      const myRankPromise = optionalUser
        ? db.execute(sql`
            SELECT rank FROM (
              SELECT
                ${userTable.id} AS user_id,
                RANK() OVER (
                  ORDER BY SUM(
                    (CAST(${mountainTable.height} AS FLOAT) / 10) *
                    CASE WHEN ${mountainTable.essential} THEN 2 ELSE 1 END
                  ) DESC
                ) AS rank
              FROM ${userTable}
              LEFT JOIN ${summitHasUsersTable}
                ON ${userTable.id} = ${summitHasUsersTable.userId}
              LEFT JOIN ${summitTable}
                ON ${summitHasUsersTable.summitId} = ${summitTable.id}
              LEFT JOIN ${mountainTable}
                ON ${summitTable.mountainId} = ${mountainTable.id}
              LEFT JOIN ${challengeHasMountainTable}
                ON ${mountainTable.id} = ${challengeHasMountainTable.mountainId}
              WHERE ${summitTable.validated} = true
                AND ${userTable.visibleOnHiscores} = true
                AND ${challengeHasMountainTable.challengeId} = ${challengeId}
              GROUP BY ${userTable.id}
            ) ranked
            WHERE user_id = ${optionalUser.id}
          `)
        : Promise.resolve(null);

      const [countResult, results, myRankResult] = await Promise.all([
        db
          .select({ count: count(sql`DISTINCT ${userTable.id}`) })
          .from(userTable)
          .leftJoin(
            summitHasUsersTable,
            eq(userTable.id, summitHasUsersTable.userId),
          )
          .leftJoin(
            summitTable,
            eq(summitHasUsersTable.summitId, summitTable.id),
          )
          .leftJoin(mountainTable, eq(summitTable.mountainId, mountainTable.id))
          .leftJoin(
            challengeHasMountainTable,
            eq(mountainTable.id, challengeHasMountainTable.mountainId),
          )
          .where(whereCondition),
        baseQuery.limit(pageSize).offset(offset),
        myRankPromise,
      ]);

      const totalItems = Number(countResult[0]?.count ?? 0);
      const totalPages = Math.ceil(totalItems / pageSize);

      const myRankRow = Array.isArray(myRankResult)
        ? (myRankResult[0] as { rank: number | string } | undefined)
        : undefined;
      const myRank = myRankRow ? Number(myRankRow.rank) : null;

      return {
        success: true,
        message: {
          items: results,
          pagination: {
            page,
            pageSize,
            totalItems,
            totalPages,
            hasMore: page < totalPages,
            myRank,
          },
        },
      };
    }

    // No pagination - return all results
    const results = await baseQuery;

    // Old app passes challengeId explicitly - return old format (array directly)
    if (query.challengeId) {
      return {
        success: true,
        message: results,
      };
    }

    // New app without pagination params - return paginated format
    const totalItems = results.length;
    return {
      success: true,
      message: {
        items: results,
        pagination: {
          page: 1,
          pageSize: totalItems,
          totalItems,
          totalPages: 1,
          hasMore: false,
        },
      },
    };
  },
  {
    query: t.Object({
      challengeId: t.Optional(t.String()),
      page: t.Optional(t.Number()),
      limit: t.Optional(t.Number()),
    }),
    response: SuccessResponse(HiscoresResponseSchema),
  },
);
