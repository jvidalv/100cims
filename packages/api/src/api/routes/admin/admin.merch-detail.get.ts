import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { merchTable } from "@/db/schema";
import { AdminMerchEntrySchema } from "@/api/schemas/admin.schema";
import {
  ErrorFieldResponse,
  SuccessResponse,
} from "@/api/schemas/common.schema";

export const adminMerchDetailGetRoute = new Elysia().get(
  "/merch/:id",
  async ({ params, set }) => {
    const [row] = await db
      .select()
      .from(merchTable)
      .where(eq(merchTable.id, params.id));
    if (!row) {
      set.status = 404;
      return { error: "Merch not found" };
    }
    return { success: true, message: row };
  },
  {
    params: t.Object({ id: t.String() }),
    response: {
      200: SuccessResponse(AdminMerchEntrySchema),
      404: ErrorFieldResponse,
    },
  },
);
