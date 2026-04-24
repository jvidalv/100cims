import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import {
  mountainCommentTable,
  mountainCommentUpvoteTable,
  summitTable,
  userTable,
} from "@/db/schema";
import { getAdminUserId } from "@/api/routes/admin/admin-context";
import { SuccessResponse } from "@/api/schemas/common.schema";
import { MountainCommentsResponseSchema } from "@/api/schemas/mountain-comment.schema";

export const adminMountainCommentsGetRoute = new Elysia().get(
  "/mountains/:id/comments",
  async ({ params, request }) => {
    const viewerId = getAdminUserId(request);

    // 1. Top-level comments first (parent_comment_id IS NULL), sorted by
    //    upvote DESC, createdAt DESC. Replies next, sorted by createdAt ASC.
    const rows = await db
      .select({
        id: mountainCommentTable.id,
        mountainId: mountainCommentTable.mountainId,
        parentCommentId: mountainCommentTable.parentCommentId,
        body: mountainCommentTable.body,
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
      .where(eq(mountainCommentTable.mountainId, params.id))
      .orderBy(
        // Top-level first via a boolean expression on parentCommentId
        desc(mountainCommentTable.upvoteCount),
        asc(mountainCommentTable.createdAt),
      );

    if (rows.length === 0) {
      return { success: true, message: [] };
    }

    // 2. Resolve which of these comments the viewer has upvoted.
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
    const upvotedSet = new Set(upvotedRows.map((u) => u.commentId));

    // 3. Sort in code so top-level comments come first.
    const enriched = rows.map((r) => ({
      ...r,
      viewerHasUpvoted: upvotedSet.has(r.id),
    }));
    enriched.sort((a, b) => {
      const aTop = a.parentCommentId === null ? 0 : 1;
      const bTop = b.parentCommentId === null ? 0 : 1;
      if (aTop !== bTop) return aTop - bTop;
      if (aTop === 0) {
        // top-level: upvote DESC, then createdAt DESC
        if (a.upvoteCount !== b.upvoteCount)
          return b.upvoteCount - a.upvoteCount;
        return b.createdAt.getTime() - a.createdAt.getTime();
      }
      // replies: createdAt ASC
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    return { success: true, message: enriched };
  },
  {
    params: t.Object({ id: t.String() }),
    response: SuccessResponse(MountainCommentsResponseSchema),
  },
);
