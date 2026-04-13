import { asc, desc, eq, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "@/db";
import { merchTable } from "@/db/schema";
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
      featured: r.featured,
      createdAt: r.createdAt,
    }));
    return { success: true, message: items };
  },
  { response: SuccessResponse(t.Array(MerchEntrySchema)) },
);
