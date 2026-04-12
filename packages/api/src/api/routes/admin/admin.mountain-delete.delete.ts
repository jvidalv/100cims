import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { mountainTable } from "@/db/schema";
import {
  ErrorFieldResponse,
  SimpleSuccessResponse,
} from "@/api/schemas/common.schema";

export const adminMountainDeleteDeleteRoute = new Elysia().delete(
  "/mountains/:id",
  async ({ params, set }) => {
    const [row] = await db
      .delete(mountainTable)
      .where(eq(mountainTable.id, params.id))
      .returning({ id: mountainTable.id });

    if (!row) {
      set.status = 404;
      return { error: "Mountain not found" };
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
