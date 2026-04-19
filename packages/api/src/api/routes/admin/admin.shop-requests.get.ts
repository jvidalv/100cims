import { desc } from "drizzle-orm";
import { Elysia } from "elysia";

import { AdminShopRequestListResponseSchema } from "@/api/schemas/admin.schema";
import { SuccessResponse } from "@/api/schemas/common.schema";
import { db } from "@/db";
import { shopRequestTable } from "@/db/schema";

export const adminShopRequestsGetRoute = new Elysia().get(
  "/shop-requests",
  async () => {
    const rows = await db
      .select()
      .from(shopRequestTable)
      .orderBy(desc(shopRequestTable.createdAt));
    return { success: true, message: { items: rows } };
  },
  { response: SuccessResponse(AdminShopRequestListResponseSchema) },
);
