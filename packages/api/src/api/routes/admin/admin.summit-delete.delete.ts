import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { summitTable } from "@/db/schema";
import {
  ErrorFieldResponse,
  SimpleSuccessResponse,
} from "@/api/schemas/common.schema";

export const adminSummitDeleteDeleteRoute = new Elysia().delete(
  "/summits/:id",
  async ({ params, set }) => {
    const [row] = await db
      .delete(summitTable)
      .where(eq(summitTable.id, params.id))
      .returning({ id: summitTable.id });

    if (!row) {
      set.status = 404;
      return { error: "Summit not found" };
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
