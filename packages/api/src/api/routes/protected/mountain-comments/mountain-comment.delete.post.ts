import { and, eq } from "drizzle-orm";
import { Elysia } from "elysia";

import { db } from "@/db";
import { mountainCommentTable } from "@/db/schema";
import { getUserFromRequest } from "@/api/routes/@shared/auth";
import {
  ErrorFieldResponse,
  SimpleSuccessResponse,
} from "@/api/schemas/common.schema";
import { DeleteMountainCommentBody } from "@/api/schemas/mountain-comment.schema";

export const mountainCommentDeletePostRoute = new Elysia().post(
  "/delete",
  async ({ body, request, set }) => {
    const viewer = getUserFromRequest(request);

    // Ownership: author-only. Cascade cleans replies and upvotes.
    const [row] = await db
      .delete(mountainCommentTable)
      .where(
        and(
          eq(mountainCommentTable.id, body.id),
          eq(mountainCommentTable.userId, viewer.id),
        ),
      )
      .returning({ id: mountainCommentTable.id });

    if (!row) {
      set.status = 404;
      return { error: "Comment not found" };
    }
    return { success: true };
  },
  {
    body: DeleteMountainCommentBody,
    response: {
      200: SimpleSuccessResponse,
      404: ErrorFieldResponse,
    },
  },
);
