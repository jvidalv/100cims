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
      const [countResult, results] = await Promise.all([
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
      ]);

      const totalItems = Number(countResult[0]?.count ?? 0);
      const totalPages = Math.ceil(totalItems / pageSize);

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
