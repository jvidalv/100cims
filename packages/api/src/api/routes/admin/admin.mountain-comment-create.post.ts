import { and, eq } from "drizzle-orm";
import { Elysia } from "elysia";

import { db } from "@/db";
import { mountainCommentTable, summitTable, userTable } from "@/db/schema";
import { getAdminUserId } from "@/api/routes/admin/admin-context";
import {
  ErrorFieldResponse,
  SuccessResponse,
} from "@/api/schemas/common.schema";
import {
  CreateMountainCommentBody,
  MountainCommentSchema,
} from "@/api/schemas/mountain-comment.schema";

export const adminMountainCommentCreatePostRoute = new Elysia().post(
  "/mountain-comments/create",
  async ({ body, request, set }) => {
    const viewerId = getAdminUserId(request);

    // Depth-2 enforcement: if replying, verify parent exists + belongs to the
    // same mountain. If parent is itself a reply, re-parent to its ancestor.
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
        userId: viewerId,
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
      .where(eq(userTable.id, viewerId));

    const [summit] = await db
      .select({ id: summitTable.id })
      .from(summitTable)
      .where(
        and(
          eq(summitTable.userId, viewerId),
          eq(summitTable.mountainId, body.mountainId),
        ),
      )
      .limit(1);

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
