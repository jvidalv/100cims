import { asc, desc, sql } from "drizzle-orm";
import { Elysia } from "elysia";

import { db } from "@/db";
import { merchTable } from "@/db/schema";
import { AdminMerchListResponseSchema } from "@/api/schemas/admin.schema";
import { SuccessResponse } from "@/api/schemas/common.schema";

export const adminMerchGetRoute = new Elysia().get(
  "/merch",
  async () => {
    const items = await db
      .select()
      .from(merchTable)
      .orderBy(
        sql`${merchTable.featured} ASC NULLS LAST`,
        desc(merchTable.createdAt),
        asc(merchTable.slug),
      );
    return { success: true, message: { items } };
  },
  { response: SuccessResponse(AdminMerchListResponseSchema) },
);
