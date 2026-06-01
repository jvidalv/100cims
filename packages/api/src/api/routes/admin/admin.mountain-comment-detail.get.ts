import { and, asc, eq, ne, or } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { mountainCommentTable, mountainTable, userTable } from "@/db/schema";
import { AdminMountainCommentDetailResponseSchema } from "@/api/schemas/admin-mountain-comment.schema";
import {
  ErrorFieldResponse,
  SuccessResponse,
} from "@/api/schemas/common.schema";

/**
 * Admin detail view of a single comment with thread context. Returns the
 * comment, its parent (if it's a reply), and the rest of the thread's
 * replies as `siblings` so moderators can see the surrounding conversation.
 */
export const adminMountainCommentDetailGetRoute = new Elysia().get(
  "/mountain-comments/:id",
  async ({ params, set }) => {
    const baseSelection = {
      id: mountainCommentTable.id,
      body: mountainCommentTable.body,
      images: mountainCommentTable.images,
      upvoteCount: mountainCommentTable.upvoteCount,
      parentCommentId: mountainCommentTable.parentCommentId,
      createdAt: mountainCommentTable.createdAt,
      mountain: {
        id: mountainTable.id,
        name: mountainTable.name,
        slug: mountainTable.slug,
        imageUrl: mountainTable.imageUrl,
      },
      user: {
        id: userTable.id,
        username: userTable.username,
        firstName: userTable.firstName,
        lastName: userTable.lastName,
        imageUrl: userTable.imageUrl,
        email: userTable.email,
      },
    };

    const [comment] = await db
      .select(baseSelection)
      .from(mountainCommentTable)
      .innerJoin(
        mountainTable,
        eq(mountainCommentTable.mountainId, mountainTable.id),
      )
      .innerJoin(userTable, eq(mountainCommentTable.userId, userTable.id))
      .where(eq(mountainCommentTable.id, params.id));

    if (!comment) {
      set.status = 404;
      return { error: "Comment not found" };
    }

    // The thread root is either this comment (if top-level) or its parent.
    const threadRootId = comment.parentCommentId ?? comment.id;

    const parentId = comment.parentCommentId;
    const [parent, siblings] = await Promise.all([
      parentId
        ? db
            .select(baseSelection)
            .from(mountainCommentTable)
            .innerJoin(
              mountainTable,
              eq(mountainCommentTable.mountainId, mountainTable.id),
            )
            .innerJoin(userTable, eq(mountainCommentTable.userId, userTable.id))
            .where(eq(mountainCommentTable.id, parentId))
            .then((rows) => rows[0] ?? null)
        : Promise.resolve(null),
      // Siblings are every reply on the same thread except this comment
      // itself. For a top-level comment, this returns its direct replies.
      db
        .select(baseSelection)
        .from(mountainCommentTable)
        .innerJoin(
          mountainTable,
          eq(mountainCommentTable.mountainId, mountainTable.id),
        )
        .innerJoin(userTable, eq(mountainCommentTable.userId, userTable.id))
        .where(
          and(
            or(
              eq(mountainCommentTable.parentCommentId, threadRootId),
              eq(mountainCommentTable.id, threadRootId),
            ),
            ne(mountainCommentTable.id, comment.id),
            comment.parentCommentId
              ? ne(mountainCommentTable.id, comment.parentCommentId)
              : undefined,
          ),
        )
        .orderBy(asc(mountainCommentTable.createdAt)),
    ]);

    return {
      success: true,
      message: { comment, parent, siblings },
    };
  },
  {
    params: t.Object({ id: t.String() }),
    response: {
      200: SuccessResponse(AdminMountainCommentDetailResponseSchema),
      404: ErrorFieldResponse,
    },
  },
);
