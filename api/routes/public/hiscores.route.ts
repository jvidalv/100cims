import { and, desc, eq, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/api/db";
import {
  challengeHasMountainTable,
  mountainTable,
  summitHasUsersTable,
  summitTable,
  userTable,
} from "@/api/db/schema";
import { JWT } from "@/api/routes/@shared/jwt";

export const hiscoresRoute = new Elysia({ prefix: "/hiscores" }).use(JWT()).get(
  "/all",
  async ({ query }) => {
    const results = await db
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
      .where(
        and(
          eq(summitTable.validated, true),
          eq(userTable.visibleOnHiscores, true),
          eq(challengeHasMountainTable.challengeId, query.challengeId), // Filter by challenge ID
        ),
      )
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

    return {
      success: true,
      message: results,
    };
  },
  {
    query: t.Object({
      challengeId: t.String(),
    }),
    response: t.Object({
      success: t.Boolean(),
      message: t.Array(
        t.Object({
          userId: t.String(),
          firstName: t.Nullable(t.String()),
          lastName: t.Nullable(t.String()),
          imageUrl: t.Nullable(t.String()),
          summitsCount: t.String(),
          uniquePeaksCount: t.String(),
          essentialPeaksCount: t.String(),
          totalScore: t.Number(),
        }),
      ),
    }),
  },
);
