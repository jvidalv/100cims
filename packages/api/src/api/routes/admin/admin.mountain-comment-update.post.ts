import { eq } from "drizzle-orm";
import { Elysia } from "elysia";

import { db } from "@/db";
import { mountainCommentTable } from "@/db/schema";
import {
  ErrorFieldResponse,
  SimpleSuccessResponse,
} from "@/api/schemas/common.schema";
import { UpdateMountainCommentBody } from "@/api/schemas/mountain-comment.schema";

export const adminMountainCommentUpdatePostRoute = new Elysia().post(
  "/mountain-comments/update",
  async ({ body, set }) => {
    const [updated] = await db
      .update(mountainCommentTable)
      .set({ body: body.body, updatedAt: new Date() })
      .where(eq(mountainCommentTable.id, body.id))
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
