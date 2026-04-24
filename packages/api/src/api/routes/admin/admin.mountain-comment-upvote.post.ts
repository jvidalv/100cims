import { and, eq } from "drizzle-orm";
import { Elysia } from "elysia";

import { db } from "@/db";
import { mountainCommentTable, mountainCommentUpvoteTable } from "@/db/schema";
import { getAdminUserId } from "@/api/routes/admin/admin-context";
import { recalcMountainCommentUpvoteCount } from "@/api/lib/mountain-comments";
import {
  ErrorFieldResponse,
  SuccessResponse,
} from "@/api/schemas/common.schema";
import {
  UpvoteMountainCommentBody,
  UpvoteMountainCommentResponseSchema,
} from "@/api/schemas/mountain-comment.schema";

export const adminMountainCommentUpvotePostRoute = new Elysia().post(
  "/mountain-comments/upvote",
  async ({ body, request, set }) => {
    const viewerId = getAdminUserId(request);

    const result = await db.transaction(async (tx) => {
      const [existingComment] = await tx
        .select({ id: mountainCommentTable.id })
        .from(mountainCommentTable)
        .where(eq(mountainCommentTable.id, body.commentId));
      if (!existingComment) return null;

      const [existingUpvote] = await tx
        .select({ id: mountainCommentUpvoteTable.id })
        .from(mountainCommentUpvoteTable)
        .where(
          and(
            eq(mountainCommentUpvoteTable.commentId, body.commentId),
            eq(mountainCommentUpvoteTable.userId, viewerId),
          ),
        );

      let viewerHasUpvoted: boolean;
      if (existingUpvote) {
        await tx
          .delete(mountainCommentUpvoteTable)
          .where(eq(mountainCommentUpvoteTable.id, existingUpvote.id));
        viewerHasUpvoted = false;
      } else {
        await tx.insert(mountainCommentUpvoteTable).values({
          commentId: body.commentId,
          userId: viewerId,
        });
        viewerHasUpvoted = true;
      }

      await recalcMountainCommentUpvoteCount(body.commentId, tx);

      const [refreshed] = await tx
        .select({ upvoteCount: mountainCommentTable.upvoteCount })
        .from(mountainCommentTable)
        .where(eq(mountainCommentTable.id, body.commentId));

      return {
        commentId: body.commentId,
        upvoteCount: refreshed?.upvoteCount ?? 0,
        viewerHasUpvoted,
      };
    });

    if (!result) {
      set.status = 404;
      return { error: "Comment not found" };
    }
    return { success: true, message: result };
  },
  {
    body: UpvoteMountainCommentBody,
    response: {
      200: SuccessResponse(UpvoteMountainCommentResponseSchema),
      404: ErrorFieldResponse,
    },
  },
);
