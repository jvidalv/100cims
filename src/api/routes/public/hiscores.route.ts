import { and, desc, eq, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import {
  challengeHasMountainTable,
  mountainTable,
  summitHasUsersTable,
  summitTable,
  userTable,
} from "@/db/schema";
import { JWT } from "@/api/routes/@shared/jwt";
import { SuccessResponse } from "@/api/schemas/common.schema";
import { HiscoresArraySchema } from "@/api/schemas/hiscores.schema";

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
          eq(challengeHasMountainTable.challengeId, query.challengeId),
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
    response: SuccessResponse(HiscoresArraySchema),
  },
);
