import { desc, eq, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import {
  mountainTable,
  summitHasUsersTable,
  summitTable,
  userTable,
} from "@/db/schema";
import { SuccessResponse } from "@/api/schemas/common.schema";
import { PublicSummitsArraySchema } from "@/api/schemas/user.schema";

export const userSummitsGetRoute = new Elysia().get(
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
      .where(eq(summitHasUsersTable.userId, userId))
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
      .orderBy(desc(summitTable.summitedAt), desc(summitTable.createdAt));

    return {
      success: true,
      message: results,
    };
  },
  {
    query: t.Object({
      userId: t.String(),
    }),
    response: SuccessResponse(PublicSummitsArraySchema),
  },
);
