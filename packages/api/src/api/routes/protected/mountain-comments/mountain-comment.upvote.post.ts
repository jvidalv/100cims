import { and, eq } from "drizzle-orm";
import { Elysia } from "elysia";

import { db } from "@/db";
import {
  mountainCommentTable,
  mountainCommentUpvoteTable,
  mountainTable,
} from "@/db/schema";
import { getUserFromRequest } from "@/api/routes/@shared/auth";
import { recalcMountainCommentUpvoteCount } from "@/api/lib/mountain-comments";
import { sendPushLocalized } from "@/api/lib/push";
import {
  pushCommentUpvoteMilestoneBody,
  pushCommentUpvoteMilestoneTitle,
} from "@/api/lib/push-translations";
import { PUSH_TYPE } from "@/api/lib/push-types";
import {
  ErrorFieldResponse,
  SuccessResponse,
} from "@/api/schemas/common.schema";
import {
  UpvoteMountainCommentBody,
  UpvoteMountainCommentResponseSchema,
} from "@/api/schemas/mountain-comment.schema";

// Upvote milestones (strict "crossed" semantics — fire when prev < M && now >= M).
const MILESTONES = [5, 10, 15, 20] as const;

export const mountainCommentUpvotePostRoute = new Elysia().post(
  "/upvote",
  async ({ body, request, set }) => {
    const viewer = getUserFromRequest(request);

    const result = await db.transaction(async (tx) => {
      const [existingComment] = await tx
        .select({
          id: mountainCommentTable.id,
          userId: mountainCommentTable.userId,
          mountainId: mountainCommentTable.mountainId,
          upvoteCount: mountainCommentTable.upvoteCount,
        })
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
        previousUpvoteCount: existingComment.upvoteCount,
        authorUserId: existingComment.userId,
        mountainId: existingComment.mountainId,
      };
    });

    if (!result) {
      set.status = 404;
      return { error: "Comment not found" };
    }

    // Milestone push: only fire on a fresh upvote (not un-upvote) that
    // crossed a threshold, and never to the author themselves.
    if (result.viewerHasUpvoted && result.authorUserId !== viewer.id) {
      const crossed = MILESTONES.find(
        (m) => result.previousUpvoteCount < m && result.upvoteCount >= m,
      );
      if (crossed !== undefined) {
        void (async () => {
          try {
            const [mountain] = await db
              .select({ name: mountainTable.name, slug: mountainTable.slug })
              .from(mountainTable)
              .where(eq(mountainTable.id, result.mountainId))
              .limit(1);
            if (!mountain) return;
            void sendPushLocalized(
              [result.authorUserId],
              (locale) => ({
                title: pushCommentUpvoteMilestoneTitle(locale, crossed),
                body: pushCommentUpvoteMilestoneBody(locale, mountain.name),
              }),
              {
                type: PUSH_TYPE.COMMENT_UPVOTE_MILESTONE,
                mountainId: result.mountainId,
                mountainSlug: mountain.slug,
                commentId: result.commentId,
                milestone: crossed,
              },
            );
          } catch (e) {
            console.error("[comment-upvote-milestone-notify] failed", e);
          }
        })();
      }
    }

    return {
      success: true,
      message: {
        commentId: result.commentId,
        upvoteCount: result.upvoteCount,
        viewerHasUpvoted: result.viewerHasUpvoted,
      },
    };
  },
  {
    body: UpvoteMountainCommentBody,
    response: {
      200: SuccessResponse(UpvoteMountainCommentResponseSchema),
      404: ErrorFieldResponse,
    },
  },
);
