import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { mountainCommentTable } from "@/db/schema";
import {
  ErrorFieldResponse,
  SimpleSuccessResponse,
} from "@/api/schemas/common.schema";

export const adminMountainCommentDeleteDeleteRoute = new Elysia().delete(
  "/mountain-comments/:id",
  async ({ params, set }) => {
    const [row] = await db
      .delete(mountainCommentTable)
      .where(eq(mountainCommentTable.id, params.id))
      .returning({ id: mountainCommentTable.id });

    if (!row) {
      set.status = 404;
      return { error: "Comment not found" };
    }
    return { success: true };
  },
  {
    params: t.Object({ id: t.String() }),
    response: {
      200: SimpleSuccessResponse,
      404: ErrorFieldResponse,
    },
  },
);
