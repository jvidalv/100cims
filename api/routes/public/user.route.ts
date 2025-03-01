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

export const userRoute = new Elysia({ prefix: "/user" })
  .get(
    "/one",
    async ({ query }) => {
      const users = await db
        .select()
        .from(userTable)
        .where(eq(userTable.id, query.userId));
      const user = users?.[0];

      return {
        success: true,
        message: user,
      };
    },
    {
      query: t.Object({
        userId: t.String(),
      }),
    },
  )
  .get(
    "/summits",
    async ({ query }) => {
      const userId = query.userId;

      const results = await db
        .select({
          summitId: summitTable.id,
          summitedAt: summitTable.summitedAt,
          summitedValidated: summitTable.validated,
          summitedImageUrl: summitTable.imageUrl,
          mountainName: mountainTable.name,
          mountainSlug: mountainTable.slug,
          mountainImageUrl: mountainTable.imageUrl,
          mountainHeight: mountainTable.height,
          mountainEssential: mountainTable.essential,
          participants: sql<
            {
              userId: string;
              firstName: string | null;
              lastName: string | null;
              imageUrl: string | null;
            }[]
          >`COALESCE(
          ARRAY(
            SELECT jsonb_build_object(
              'userId', ${userTable.id},
              'firstName', ${userTable.firstName},
              'lastName', ${userTable.lastName},
              'imageUrl', ${userTable.imageUrl}
            )
            FROM ${summitHasUsersTable}
            INNER JOIN ${userTable}
            ON ${summitHasUsersTable.userId} = ${userTable.id}
            WHERE ${summitHasUsersTable.summitId} = ${summitTable.id}
            AND ${summitHasUsersTable.userId} != ${userId}
          ), '{}'
        )`.as("participants"),
        })
        .from(summitHasUsersTable)
        .innerJoin(
          summitTable,
          eq(summitHasUsersTable.summitId, summitTable.id),
        )
        .innerJoin(mountainTable, eq(summitTable.mountainId, mountainTable.id))
        .leftJoin(
          challengeHasMountainTable,
          eq(mountainTable.id, challengeHasMountainTable.mountainId),
        )
        .where(and(eq(summitHasUsersTable.userId, userId)))
        .groupBy(
          summitTable.id,
          summitTable.summitedAt,
          summitTable.validated,
          mountainTable.name,
          mountainTable.slug,
          mountainTable.imageUrl,
          mountainTable.height,
          mountainTable.essential,
        )
        .orderBy(desc(summitTable.createdAt));

      return {
        success: true,
        message: results,
      };
    },
    {
      query: t.Object({
        userId: t.String(),
      }),
    },
  );
