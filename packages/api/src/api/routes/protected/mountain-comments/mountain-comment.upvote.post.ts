import { and, eq } from "drizzle-orm";
import { Elysia } from "elysia";

import { db } from "@/db";
import { mountainCommentTable, mountainCommentUpvoteTable } from "@/db/schema";
import { getUserFromRequest } from "@/api/routes/@shared/auth";
import { recalcMountainCommentUpvoteCount } from "@/api/lib/mountain-comments";
import {
  ErrorFieldResponse,
  SuccessResponse,
} from "@/api/schemas/common.schema";
import {
  UpvoteMountainCommentBody,
  UpvoteMountainCommentResponseSchema,
} from "@/api/schemas/mountain-comment.schema";

export const mountainCommentUpvotePostRoute = new Elysia().post(
  "/upvote",
  async ({ body, request, set }) => {
    const viewer = getUserFromRequest(request);

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
            eq(mountainCommentUpvoteTable.userId, viewer.id),
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
          userId: viewer.id,
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
