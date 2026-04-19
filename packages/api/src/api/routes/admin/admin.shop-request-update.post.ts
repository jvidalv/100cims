import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { AdminShopRequestUpdateBodySchema } from "@/api/schemas/admin.schema";
import {
  ErrorFieldResponse,
  SimpleSuccessResponse,
} from "@/api/schemas/common.schema";
import { db } from "@/db";
import { shopRequestTable } from "@/db/schema";

export const adminShopRequestUpdatePostRoute = new Elysia().post(
  "/shop-requests/:id",
  async ({ params, body, set }) => {
    const [row] = await db
      .update(shopRequestTable)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(shopRequestTable.id, params.id))
      .returning({ id: shopRequestTable.id });
    if (!row) {
      set.status = 404;
      return { error: "Shop request not found" };
    }
    return { success: true };
  },
  {
    params: t.Object({ id: t.String() }),
    body: AdminShopRequestUpdateBodySchema,
    response: {
      200: SimpleSuccessResponse,
      404: ErrorFieldResponse,
    },
  },
);
