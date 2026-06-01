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
      .where(eq(mountainCommentTable.mountainId, params.id))
      .orderBy(
        desc(mountainCommentTable.upvoteCount),
        asc(mountainCommentTable.createdAt),
      );

    if (rows.length === 0) {
      return { success: true, message: [] };
    }

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

    // The SQL ORDER BY can't co-rank by parent presence + upvotes + createdAt
    // direction without a CASE expression that hurts readability; sort here.
    const enriched = rows.map((r) => ({
      ...r,
      viewerHasUpvoted: upvotedSet.has(r.id),
    }));
    enriched.sort((a, b) => {
      const aTop = a.parentCommentId === null ? 0 : 1;
      const bTop = b.parentCommentId === null ? 0 : 1;
      if (aTop !== bTop) return aTop - bTop;
      if (aTop === 0) {
        if (a.upvoteCount !== b.upvoteCount)
          return b.upvoteCount - a.upvoteCount;
        return b.createdAt.getTime() - a.createdAt.getTime();
      }
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    return { success: true, message: enriched };
  },
  {
    params: t.Object({ id: t.String() }),
    response: SuccessResponse(MountainCommentsResponseSchema),
  },
);
