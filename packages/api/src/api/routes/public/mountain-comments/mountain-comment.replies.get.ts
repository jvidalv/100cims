import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import {
  mountainCommentTable,
  mountainCommentUpvoteTable,
  summitTable,
  userTable,
} from "@/db/schema";
import { JWT } from "@/api/routes/@shared/jwt";
import {
  getBearerToken,
  getOptionalUserId,
} from "@/api/routes/@shared/optional-auth";
import { SuccessResponse } from "@/api/schemas/common.schema";
import { MountainCommentsResponseSchema } from "@/api/schemas/mountain-comment.schema";

// Returns every reply for a given parent comment, ordered oldest → newest.
// Depth is capped at 2 so replies never have their own replies — no pagination
// needed in practice for this endpoint.
export const mountainCommentRepliesGetRoute = new Elysia().use(JWT()).get(
  "/replies",
  async ({ query, jwt, headers }) => {
    const viewerId = await getOptionalUserId(jwt, getBearerToken(headers));

    const rows = await db
      .select({
        id: mountainCommentTable.id,
        mountainId: mountainCommentTable.mountainId,
        parentCommentId: mountainCommentTable.parentCommentId,
        body: mountainCommentTable.body,
        images: mountainCommentTable.images,
        upvoteCount: mountainCommentTable.upvoteCount,
        createdAt: mountainCommentTable.createdAt,
        updatedAt: mountainCommentTable.updatedAt,
        user: {
          id: userTable.id,
          username: userTable.username,
          firstName: userTable.firstName,
          lastName: userTable.lastName,
          imageUrl: userTable.imageUrl,
          hasSummitedThisMountain: sql<boolean>`EXISTS (
            SELECT 1 FROM ${summitTable}
            WHERE ${summitTable.userId} = ${mountainCommentTable.userId}
              AND ${summitTable.mountainId} = ${mountainCommentTable.mountainId}
          )`,
        },
      })
      .from(mountainCommentTable)
      .innerJoin(userTable, eq(mountainCommentTable.userId, userTable.id))
      .where(eq(mountainCommentTable.parentCommentId, query.parentCommentId))
      .orderBy(asc(mountainCommentTable.createdAt));

    if (rows.length === 0) {
      return { success: true, message: [] };
    }

    let upvotedSet = new Set<string>();
    if (viewerId) {
      const upvotedRows = await db
        .select({ commentId: mountainCommentUpvoteTable.commentId })
        .from(mountainCommentUpvoteTable)
        .where(
          and(
            eq(mountainCommentUpvoteTable.userId, viewerId),
            inArray(
              mountainCommentUpvoteTable.commentId,
              rows.map((r) => r.id),
            ),
          ),
        );
      upvotedSet = new Set(upvotedRows.map((u) => u.commentId));
    }

    return {
      success: true,
      message: rows.map((r) => ({
        ...r,
        viewerHasUpvoted: upvotedSet.has(r.id),
      })),
    };
  },
  {
    query: t.Object({ parentCommentId: t.String() }),
    response: SuccessResponse(MountainCommentsResponseSchema),
  },
);
