import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { merchTable } from "@/db/schema";
import {
  ErrorFieldResponse,
  SimpleSuccessResponse,
} from "@/api/schemas/common.schema";

export const adminMerchDeleteDeleteRoute = new Elysia().delete(
  "/merch/:id",
  async ({ params, set }) => {
    const [row] = await db
      .delete(merchTable)
      .where(eq(merchTable.id, params.id))
      .returning({ id: merchTable.id });
    if (!row) {
      set.status = 404;
      return { error: "Merch not found" };
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
