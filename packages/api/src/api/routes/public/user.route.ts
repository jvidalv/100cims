import { and, desc, eq, sql } from "drizzle-orm";
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
import { SuccessResponse } from "@/api/schemas/common.schema";
import {
  UserSchema,
  PublicSummitsArraySchema,
  UserProfileResponseSchema,
  UserChallengesArraySchema,
} from "@/api/schemas/user.schema";

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
      response: SuccessResponse(UserSchema),
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
  )
  .get(
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
          };
        }
        userMap[u.odUserId].score +=
          (Number(u.odHeight) / 10) * (u.odEssential ? 2 : 1);
      }

      return {
        success: true,
        message: {
          firstSummitDate,
          lastSummitDate,
          score,
          sharedUsers: Object.values(userMap),
        },
      };
    },
    {
      query: t.Object({
        userId: t.String(),
      }),
      response: SuccessResponse(UserProfileResponseSchema),
    },
  )
  .get(
    "/challenges",
    async ({ query }) => {
      const userId = query.userId;

      // Get all challenges where the user has summited at least one mountain
      const results = await db
        .select({
          id: challengeTable.id,
          name: challengeTable.name,
          slug: challengeTable.slug,
          country: challengeTable.country,
          emoji: challengeTable.emoji,
          imageUrl: challengeTable.imageUrl,
          creatorId: challengeTable.creatorId,
          summitCount: sql<number>`COUNT(DISTINCT ${summitTable.id})`.as(
            "summitCount"
          ),
        })
        .from(summitHasUsersTable)
        .innerJoin(
          summitTable,
          eq(summitHasUsersTable.summitId, summitTable.id)
        )
        .innerJoin(mountainTable, eq(summitTable.mountainId, mountainTable.id))
        .innerJoin(
          challengeHasMountainTable,
          eq(mountainTable.id, challengeHasMountainTable.mountainId)
        )
        .innerJoin(
          challengeTable,
          eq(challengeHasMountainTable.challengeId, challengeTable.id)
        )
        .where(eq(summitHasUsersTable.userId, userId))
        .groupBy(
          challengeTable.id,
          challengeTable.name,
          challengeTable.slug,
          challengeTable.country,
          challengeTable.emoji,
          challengeTable.imageUrl,
          challengeTable.creatorId
        )
        .orderBy(desc(sql`COUNT(DISTINCT ${summitTable.id})`));

      const challenges = results.map((challenge) => ({
        id: challenge.id,
        name: challenge.name,
        slug: challenge.slug,
        country: challenge.country,
        emoji: challenge.emoji,
        imageUrl: challenge.imageUrl,
        isOfficial: challenge.creatorId === null,
        summitCount: Number(challenge.summitCount),
      }));

      return {
        success: true,
        message: challenges,
      };
    },
    {
      query: t.Object({
        userId: t.String(),
      }),
      response: SuccessResponse(UserChallengesArraySchema),
    }
  );
