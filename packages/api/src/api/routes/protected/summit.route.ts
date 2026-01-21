import { and, count, eq, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import {
  summitHasUsersTable,
  summitReactionTable,
  mountainTable,
  summitTable,
  userTable,
} from "@/db/schema";
import { JWT } from "@/api/routes/@shared/jwt";
import { getStoreUser } from "@/api/routes/@shared/store";
import { SuccessResponse } from "@/api/schemas/common.schema";
import { SummitDetailSchema } from "@/api/schemas/summit.schema";

export const summitRoute = new Elysia({ prefix: "/summit" })
  .use(JWT())
  .get(
    "/one",
    async ({ query }) => {
      const { summitId } = query;

      const results = await db
        .select({
          summitId: summitTable.id,
          summitedAt: summitTable.summitedAt,
          summitValidated: summitTable.validated,
          summitImageUrl: summitTable.imageUrl,
          mountainId: mountainTable.id,
          mountainName: mountainTable.name,
          mountainSlug: mountainTable.slug,
          mountainLocation: mountainTable.location,
          mountainEssential: mountainTable.essential,
          mountainHeight: mountainTable.height,
          mountainLatitude: mountainTable.latitude,
          mountainLongitude: mountainTable.longitude,
          mountainImageUrl: mountainTable.imageUrl,
          users: sql<
            {
              userId: string;
              firstName: string | null;
              lastName: string | null;
              imageUrl: string | null;
            }[]
          >`ARRAY(
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
        )`.as("users"),
        })
        .from(summitTable)
        .innerJoin(mountainTable, eq(summitTable.mountainId, mountainTable.id))
        .where(eq(summitTable.id, summitId));

      return {
        success: true,
        message: results[0],
      };
    },
    {
      query: t.Object({
        summitId: t.String(),
      }),
      response: SuccessResponse(SummitDetailSchema),
    },
  )
  .post(
    "/delete",
    async ({ body, store }) => {
      const { summitId } = body;

      const userId = getStoreUser(store).id;
      if (!userId) {
        return { success: false, message: "Unauthorized" };
      }

      // Check if the user is associated with the summit
      const summitUserRecord = await db
        .select()
        .from(summitHasUsersTable)
        .where(
          and(
            eq(summitHasUsersTable.summitId, summitId),
            eq(summitHasUsersTable.userId, userId),
          ),
        );

      if (!summitUserRecord.length) {
        return {
          success: false,
          message: "Summit record not found or unauthorized",
        };
      }

      // Check if user is the summit owner
      const summit = await db
        .select({ ownerId: summitTable.userId })
        .from(summitTable)
        .where(eq(summitTable.id, summitId));

      const isOwner = summit[0]?.ownerId === userId;

      await db.transaction(async (tx) => {
        // Count how many users are associated with this summit
        const userCount = await tx
          .select({ count: count() })
          .from(summitHasUsersTable)
          .where(eq(summitHasUsersTable.summitId, summitId));

        // Delete the summitHasUsers record
        await tx
          .delete(summitHasUsersTable)
          .where(
            and(
              eq(summitHasUsersTable.summitId, summitId),
              eq(summitHasUsersTable.userId, userId),
            ),
          );

        // Delete the summit if user is the owner OR if it's the last user associated
        if (isOwner || userCount[0].count === 1) {
          await tx.delete(summitTable).where(eq(summitTable.id, summitId));
        }
      });

      return { success: true, message: "Summit record deleted successfully" };
    },
    {
      body: t.Object({
        summitId: t.String(),
      }),
      response: t.Object({
        success: t.Boolean(),
        message: t.String(),
      }),
    },
  )
  .post(
    "/update",
    async ({ body, store }) => {
      const { summitId, summitedAt } = body;

      const userId = getStoreUser(store).id;
      if (!userId) {
        return { success: false, message: "Unauthorized" };
      }

      // Check if the user is associated with the summit
      const summitUserRecord = await db
        .select()
        .from(summitHasUsersTable)
        .where(
          and(
            eq(summitHasUsersTable.summitId, summitId),
            eq(summitHasUsersTable.userId, userId),
          ),
        );

      if (!summitUserRecord.length) {
        return {
          success: false,
          message: "Summit record not found or unauthorized",
        };
      }

      // Update the summit date
      await db
        .update(summitTable)
        .set({ summitedAt })
        .where(eq(summitTable.id, summitId));

      return { success: true, message: "Summit date updated successfully" };
    },
    {
      body: t.Object({
        summitId: t.String(),
        summitedAt: t.String(),
      }),
      response: t.Object({
        success: t.Boolean(),
        message: t.String(),
      }),
    },
  )
  .post(
    "/reaction",
    async ({ body, store }) => {
      const { summitId, emoji } = body;

      const userId = getStoreUser(store).id;
      if (!userId) {
        return { success: false, message: "Unauthorized" };
      }

      // Check if reaction already exists
      const existingReaction = await db
        .select()
        .from(summitReactionTable)
        .where(
          and(
            eq(summitReactionTable.summitId, summitId),
            eq(summitReactionTable.userId, userId),
            eq(summitReactionTable.emoji, emoji),
          ),
        );

      if (existingReaction.length > 0) {
        // Remove reaction (toggle off)
        await db
          .delete(summitReactionTable)
          .where(eq(summitReactionTable.id, existingReaction[0].id));

        return { success: true, message: "Reaction removed" };
      }

      // Add reaction
      await db.insert(summitReactionTable).values({
        summitId,
        userId,
        emoji,
      });

      return { success: true, message: "Reaction added" };
    },
    {
      body: t.Object({
        summitId: t.String(),
        emoji: t.String(),
      }),
      response: t.Object({
        success: t.Boolean(),
        message: t.String(),
      }),
    },
  )
  .get(
    "/reactions",
    async ({ query, store }) => {
      const { summitId } = query;

      const userId = getStoreUser(store).id;

      // Single query to get both reaction counts and user's reactions
      const reactions = await db
        .select({
          emoji: summitReactionTable.emoji,
          count: count(),
          userReacted: sql<boolean>`bool_or(${summitReactionTable.userId} = ${userId})`,
        })
        .from(summitReactionTable)
        .where(eq(summitReactionTable.summitId, summitId))
        .groupBy(summitReactionTable.emoji);

      return {
        success: true,
        message: {
          reactions: reactions.map((r) => ({
            emoji: r.emoji,
            count: Number(r.count),
          })),
          userReactions: reactions
            .filter((r) => r.userReacted)
            .map((r) => r.emoji),
        },
      };
    },
    {
      query: t.Object({
        summitId: t.String(),
      }),
      response: t.Object({
        success: t.Boolean(),
        message: t.Object({
          reactions: t.Array(
            t.Object({
              emoji: t.String(),
              count: t.Number(),
            }),
          ),
          userReactions: t.Array(t.String()),
        }),
      }),
    },
  );
