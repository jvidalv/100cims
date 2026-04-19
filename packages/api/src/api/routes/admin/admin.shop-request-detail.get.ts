import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { AdminShopRequestEntrySchema } from "@/api/schemas/admin.schema";
import {
  ErrorFieldResponse,
  SuccessResponse,
} from "@/api/schemas/common.schema";
import { db } from "@/db";
import { shopRequestTable } from "@/db/schema";

export const adminShopRequestDetailGetRoute = new Elysia().get(
  "/shop-requests/:id",
  async ({ params, set }) => {
    const [row] = await db
      .select()
      .from(shopRequestTable)
      .where(eq(shopRequestTable.id, params.id));
    if (!row) {
      set.status = 404;
      return { error: "Shop request not found" };
    }
    return { success: true, message: row };
  },
  {
    params: t.Object({ id: t.String() }),
    response: {
      200: SuccessResponse(AdminShopRequestEntrySchema),
      404: ErrorFieldResponse,
    },
  },
);
