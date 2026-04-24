import { and, eq, ne } from "drizzle-orm";
import { Elysia } from "elysia";

import { db } from "@/db";
import {
  mountainCommentTable,
  mountainTable,
  summitTable,
  userTable,
} from "@/db/schema";
import { sendPushLocalized } from "@/api/lib/push";
import {
  pushCommentReplyBody,
  pushCommentReplyTitle,
  pushCommentThreadReplyBody,
  pushCommentThreadReplyTitle,
} from "@/api/lib/push-translations";
import { PUSH_TYPE, getUserDisplayName } from "@/api/lib/push-types";
import { getUserFromRequest } from "@/api/routes/@shared/auth";
import {
  ErrorFieldResponse,
  SuccessResponse,
} from "@/api/schemas/common.schema";
import {
  CreateMountainCommentBody,
  MountainCommentSchema,
} from "@/api/schemas/mountain-comment.schema";

export const mountainCommentCreatePostRoute = new Elysia().post(
  "/create",
  async ({ body, request, set }) => {
    const viewer = getUserFromRequest(request);

    // Depth-2 flatten: reply-to-reply is re-parented to the top-level ancestor.
    let parentCommentId: string | null = null;
    if (body.parentCommentId) {
      const [parent] = await db
        .select({
          id: mountainCommentTable.id,
          mountainId: mountainCommentTable.mountainId,
          parentCommentId: mountainCommentTable.parentCommentId,
        })
        .from(mountainCommentTable)
        .where(eq(mountainCommentTable.id, body.parentCommentId));

      if (!parent) {
        set.status = 404;
        return { error: "Parent comment not found" };
      }
      if (parent.mountainId !== body.mountainId) {
        set.status = 400;
        return { error: "Parent comment belongs to a different mountain" };
      }
      parentCommentId = parent.parentCommentId ?? parent.id;
    }

    const [inserted] = await db
      .insert(mountainCommentTable)
      .values({
        mountainId: body.mountainId,
        userId: viewer.id,
        parentCommentId,
        body: body.body,
      })
      .returning();

    const [user] = await db
      .select({
        id: userTable.id,
        username: userTable.username,
        firstName: userTable.firstName,
        lastName: userTable.lastName,
        imageUrl: userTable.imageUrl,
      })
      .from(userTable)
      .where(eq(userTable.id, viewer.id));

    const [summit] = await db
      .select({ id: summitTable.id })
      .from(summitTable)
      .where(
        and(
          eq(summitTable.userId, viewer.id),
          eq(summitTable.mountainId, body.mountainId),
        ),
      )
      .limit(1);

    // Notify thread participants (only when this is a reply — top-level
    // comments don't ping anyone). `parentCommentId` here is the top-level
    // ancestor; `body.parentCommentId` is the exact comment the user tapped
    // "Reply" on (could be the top-level or a sibling reply).
    if (parentCommentId && body.parentCommentId) {
      const topLevelId = parentCommentId;
      const directReplyParentId = body.parentCommentId;
      void (async () => {
        try {
          const [mountain] = await db
            .select({ name: mountainTable.name, slug: mountainTable.slug })
            .from(mountainTable)
            .where(eq(mountainTable.id, body.mountainId))
            .limit(1);
          if (!mountain) return;

          const [directReplyParent] = await db
            .select({ userId: mountainCommentTable.userId })
            .from(mountainCommentTable)
            .where(eq(mountainCommentTable.id, directReplyParentId))
            .limit(1);

          const [topLevelRow] = await db
            .select({ userId: mountainCommentTable.userId })
            .from(mountainCommentTable)
            .where(eq(mountainCommentTable.id, topLevelId))
            .limit(1);

          const replyParticipants = await db
            .select({ userId: mountainCommentTable.userId })
            .from(mountainCommentTable)
            .where(
              and(
                eq(mountainCommentTable.parentCommentId, topLevelId),
                ne(mountainCommentTable.userId, viewer.id),
              ),
            );

          const actorName = getUserDisplayName(user!);
          const directReplyRecipient =
            directReplyParent && directReplyParent.userId !== viewer.id
              ? directReplyParent.userId
              : null;

          if (directReplyRecipient) {
            void sendPushLocalized(
              [directReplyRecipient],
              (locale) => ({
                title: pushCommentReplyTitle(locale, mountain.name),
                body: pushCommentReplyBody(locale, actorName),
              }),
              {
                type: PUSH_TYPE.COMMENT_REPLY,
                mountainId: body.mountainId,
                mountainSlug: mountain.slug,
                commentId: inserted.id,
                topLevelCommentId: topLevelId,
              },
            );
          }

          // Thread-reply recipients: top-level author + other reply authors
          // in this thread, minus the viewer and the direct-reply recipient.
          const otherParticipants = new Set<string>();
          if (topLevelRow && topLevelRow.userId !== viewer.id) {
            otherParticipants.add(topLevelRow.userId);
          }
          for (const r of replyParticipants) {
            otherParticipants.add(r.userId);
          }
          if (directReplyRecipient) {
            otherParticipants.delete(directReplyRecipient);
          }
          if (otherParticipants.size > 0) {
            void sendPushLocalized(
              Array.from(otherParticipants),
              (locale) => ({
                title: pushCommentThreadReplyTitle(locale, mountain.name),
                body: pushCommentThreadReplyBody(locale, actorName),
              }),
              {
                type: PUSH_TYPE.COMMENT_THREAD_REPLY,
                mountainId: body.mountainId,
                mountainSlug: mountain.slug,
                commentId: inserted.id,
                topLevelCommentId: topLevelId,
              },
            );
          }
        } catch (e) {
          console.error("[comment-reply-notify] failed", e);
        }
      })();
    }

    return {
      success: true,
      message: {
        id: inserted.id,
        mountainId: inserted.mountainId,
        parentCommentId: inserted.parentCommentId,
        body: inserted.body,
        upvoteCount: inserted.upvoteCount,
        viewerHasUpvoted: false,
        createdAt: inserted.createdAt,
        updatedAt: inserted.updatedAt,
        user: { ...user!, hasSummitedThisMountain: !!summit },
      },
    };
  },
  {
    body: CreateMountainCommentBody,
    response: {
      200: SuccessResponse(MountainCommentSchema),
      400: ErrorFieldResponse,
      404: ErrorFieldResponse,
    },
  },
);
