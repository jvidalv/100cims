import { asc, desc, eq, inArray, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { merchTable, merchVariantTable } from "@/db/schema";
import { resolveLocaleFromRequest } from "@/api/lib/request-headers";
import { MerchEntrySchema } from "@/api/schemas/admin.schema";
import { SuccessResponse } from "@/api/schemas/common.schema";

export const merchAllGetRoute = new Elysia().get(
  "/",
  async ({ request }) => {
    const locale = resolveLocaleFromRequest(request);
    const rows = await db
      .select()
      .from(merchTable)
      .where(eq(merchTable.active, true))
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
      id: r.id,
      slug: r.slug,
      name:
        (locale === "ca" && r.nameCa) ||
        (locale === "es" && r.nameEs) ||
        r.nameEn,
      description:
        (locale === "ca" && r.descriptionCa) ||
        (locale === "es" && r.descriptionEs) ||
        r.descriptionEn,
      shopUrl: r.shopUrl,
      imageUrls: r.imageUrls,
      hasSize: r.hasSize,
      price: r.price,
      discountedPrice: r.discountedPrice,
      featured: r.featured,
      createdAt: r.createdAt,
      variants: variantsByMerch.get(r.id) ?? [],
    }));
    return { success: true, message: items };
  },
  { response: SuccessResponse(t.Array(MerchEntrySchema)) },
);
