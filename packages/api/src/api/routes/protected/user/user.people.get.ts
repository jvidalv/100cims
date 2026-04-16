import { and, desc, eq, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { summitHasUsersTable, userPeopleTable, userTable } from "@/db/schema";
import { getUserFromRequest } from "@/api/routes/@shared/auth";
import { SuccessResponse } from "@/api/schemas/common.schema";

const UserPersonSchema = t.Object({
  userId: t.String(),
  firstName: t.Nullable(t.String()),
  lastName: t.Nullable(t.String()),
  imageUrl: t.Nullable(t.String()),
  connectedAt: t.Date(),
  sharedSummitCount: t.Number(),
});

export const userPeopleGetRoute = new Elysia().get(
  "/people",
  async ({ request }) => {
    const user = getUserFromRequest(request);
    const otherUserId = sql<string>`CASE WHEN ${userPeopleTable.userAId} = ${user.id} THEN ${userPeopleTable.userBId} ELSE ${userPeopleTable.userAId} END`;

    const shuA = alias(summitHasUsersTable, "shu_a");
    const shuB = alias(summitHasUsersTable, "shu_b");

    // Scope the self-join to pairs that involve the caller — otherwise we'd
    // aggregate every co-summit pair in the DB on each request.
    const sharedCounts = db
      .select({
        userAId: sql<string>`LEAST(${shuA.userId}, ${shuB.userId})`.as(
          "user_a_id",
        ),
        userBId: sql<string>`GREATEST(${shuA.userId}, ${shuB.userId})`.as(
          "user_b_id",
        ),
        count: sql<number>`COUNT(DISTINCT ${shuA.summitId})::int`.as("count"),
      })
      .from(shuA)
      .innerJoin(
        shuB,
        and(
          eq(shuA.summitId, shuB.summitId),
          sql`${shuA.userId} < ${shuB.userId}`,
        ),
      )
      .where(or(eq(shuA.userId, user.id), eq(shuB.userId, user.id)))
      .groupBy(
        sql`LEAST(${shuA.userId}, ${shuB.userId})`,
        sql`GREATEST(${shuA.userId}, ${shuB.userId})`,
      )
      .as("shared_counts");

    const rows = await db
      .select({
        userId: otherUserId.as("user_id"),
        firstName: userTable.firstName,
        lastName: userTable.lastName,
        imageUrl: userTable.imageUrl,
        connectedAt: userPeopleTable.createdAt,
        sharedSummitCount:
          sql<number>`COALESCE("shared_counts"."count", 0)::int`.as(
            "shared_summit_count",
          ),
      })
      .from(userPeopleTable)
      .innerJoin(userTable, eq(userTable.id, otherUserId))
      .leftJoin(
        sharedCounts,
        and(
          sql`"shared_counts"."user_a_id" = ${userPeopleTable.userAId}`,
          sql`"shared_counts"."user_b_id" = ${userPeopleTable.userBId}`,
        ),
      )
      .where(
        or(
          eq(userPeopleTable.userAId, user.id),
          eq(userPeopleTable.userBId, user.id),
        ),
      )
      .orderBy(
        desc(sql`COALESCE("shared_counts"."count", 0)`),
        desc(userPeopleTable.createdAt),
      );

    return { success: true, message: rows };
  },
  {
    response: SuccessResponse(t.Array(UserPersonSchema)),
  },
);
