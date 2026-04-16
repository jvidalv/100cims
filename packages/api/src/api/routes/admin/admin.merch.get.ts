import { asc, desc, inArray, sql } from "drizzle-orm";
import { Elysia } from "elysia";

import { db } from "@/db";
import { merchTable, merchVariantTable } from "@/db/schema";
import { AdminMerchListResponseSchema } from "@/api/schemas/admin.schema";
import { SuccessResponse } from "@/api/schemas/common.schema";

export const adminMerchGetRoute = new Elysia().get(
  "/merch",
  async () => {
    const rows = await db
      .select()
      .from(merchTable)
      .orderBy(
        sql`${merchTable.featured} ASC NULLS LAST`,
        desc(merchTable.createdAt),
        asc(merchTable.slug),
      );

    const merchIds = rows.map((r) => r.id);
    const variantRows = merchIds.length
      ? await db
          .select({
            merchId: merchVariantTable.merchId,
            color: merchVariantTable.color,
            imageUrls: merchVariantTable.imageUrls,
          })
          .from(merchVariantTable)
          .where(inArray(merchVariantTable.merchId, merchIds))
          .orderBy(asc(merchVariantTable.createdAt))
      : [];

    const variantsByMerch = new Map<
      string,
      { color: string; imageUrls: string[] }[]
    >();
    for (const v of variantRows) {
      const list = variantsByMerch.get(v.merchId) ?? [];
      list.push({ color: v.color, imageUrls: v.imageUrls });
      variantsByMerch.set(v.merchId, list);
    }

    const items = rows.map((r) => ({
      ...r,
      variants: variantsByMerch.get(r.id) ?? [],
    }));
    return { success: true, message: { items } };
  },
  { response: SuccessResponse(AdminMerchListResponseSchema) },
);
