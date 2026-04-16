import { eq, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import {
  mountainTable,
  summitHasUsersTable,
  summitTable,
  userTable,
} from "@/db/schema";
import { SuccessResponse } from "@/api/schemas/common.schema";
import { UserProfileResponseSchema } from "@/api/schemas/user.schema";

export const userUserProfileGetRoute = new Elysia().get(
  "/user-profile",
  async ({ query }) => {
    const userId = query.userId;

    const [summits, shared] = await Promise.all([
      db
        .select({
          summitedAt: summitTable.summitedAt,
          height: mountainTable.height,
          essential: mountainTable.essential,
        })
        .from(summitHasUsersTable)
        .innerJoin(
          summitTable,
          eq(summitHasUsersTable.summitId, summitTable.id),
        )
        .innerJoin(mountainTable, eq(summitTable.mountainId, mountainTable.id))
        .where(eq(summitHasUsersTable.userId, userId))
        .orderBy(summitTable.summitedAt),

      db
        .select({
          odUserId: userTable.id,
          odFirstName: userTable.firstName,
          odLastName: userTable.lastName,
          odImageUrl: userTable.imageUrl,
          odHeight: mountainTable.height,
          odEssential: mountainTable.essential,
          odSummitId: summitTable.id,
        })
        .from(summitTable)
        .innerJoin(mountainTable, eq(summitTable.mountainId, mountainTable.id))
        .innerJoin(
          summitHasUsersTable,
          eq(summitHasUsersTable.summitId, summitTable.id),
        )
        .innerJoin(userTable, eq(userTable.id, summitHasUsersTable.userId))
        .where(sql`
          ${summitTable.id} IN (
            SELECT summit_id FROM ${summitHasUsersTable}
            WHERE user_id = ${userId}
          )
          AND ${userTable.id} != ${userId}
        `),
    ]);

    const firstSummitDate = summits[0]?.summitedAt ?? null;
    const lastSummitDate = summits.at(-1)?.summitedAt ?? null;

    const score = summits.reduce(
      (acc, s) => acc + (Number(s.height) / 10) * (s.essential ? 2 : 1),
      0,
    );

    const userMap: Record<
      string,
      {
        userId: string;
        firstName: string | null;
        lastName: string | null;
        imageUrl: string | null;
        score: number;
        summitIds: Set<string>;
      }
    > = {};

    for (const u of shared) {
      if (!userMap[u.odUserId]) {
        userMap[u.odUserId] = {
          userId: u.odUserId,
          firstName: u.odFirstName,
          lastName: u.odLastName,
          imageUrl: u.odImageUrl,
          score: 0,
          summitIds: new Set(),
        };
      }
      userMap[u.odUserId].score +=
        (Number(u.odHeight) / 10) * (u.odEssential ? 2 : 1);
      userMap[u.odUserId].summitIds.add(u.odSummitId);
    }

    const sharedUsers = Object.values(userMap).map(
      ({ summitIds, ...rest }) => ({
        ...rest,
        summitsTogetherCount: summitIds.size,
      }),
    );

    return {
      success: true,
      message: {
        firstSummitDate,
        lastSummitDate,
        score,
        sharedUsers,
      },
    };
  },
  {
    query: t.Object({
      userId: t.String(),
    }),
    response: SuccessResponse(UserProfileResponseSchema),
  },
);
