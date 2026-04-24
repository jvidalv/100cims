import { and, eq } from "drizzle-orm";
import { Elysia } from "elysia";

import { db } from "@/db";
import { mountainCommentTable } from "@/db/schema";
import { getUserFromRequest } from "@/api/routes/@shared/auth";
import {
  ErrorFieldResponse,
  SimpleSuccessResponse,
} from "@/api/schemas/common.schema";
import { UpdateMountainCommentBody } from "@/api/schemas/mountain-comment.schema";

export const mountainCommentUpdatePostRoute = new Elysia().post(
  "/update",
  async ({ body, request, set }) => {
    const viewer = getUserFromRequest(request);

    // Ownership: only the author can update their own comment. Admin uses
    // the admin-side update endpoint.
    const [updated] = await db
      .update(mountainCommentTable)
      .set({ body: body.body, updatedAt: new Date() })
      .where(
        and(
          eq(mountainCommentTable.id, body.id),
          eq(mountainCommentTable.userId, viewer.id),
        ),
      )
      .returning({ id: mountainCommentTable.id });

    if (!updated) {
      set.status = 404;
      return { error: "Comment not found" };
    }
    return { success: true };
  },
  {
    body: UpdateMountainCommentBody,
    response: {
      200: SimpleSuccessResponse,
      404: ErrorFieldResponse,
    },
  },
);
