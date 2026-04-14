import { and, asc, desc, eq, sql } from "drizzle-orm";
import { cache } from "react";

import { db } from "@/db";
import { merchTable } from "@/db/schema";

export interface MerchRow {
  id: string;
  slug: string;
  nameEn: string;
  nameCa: string | null;
  nameEs: string | null;
  descriptionEn: string | null;
  descriptionCa: string | null;
  descriptionEs: string | null;
  shopUrl: string | null;
  imageUrls: string[];
  hasSize: boolean;
  price: number;
  featured: number | null;
  createdAt: Date;
}

const SELECT = {
  id: merchTable.id,
  slug: merchTable.slug,
  nameEn: merchTable.nameEn,
  nameCa: merchTable.nameCa,
  nameEs: merchTable.nameEs,
  descriptionEn: merchTable.descriptionEn,
  descriptionCa: merchTable.descriptionCa,
  descriptionEs: merchTable.descriptionEs,
  shopUrl: merchTable.shopUrl,
  imageUrls: merchTable.imageUrls,
  hasSize: merchTable.hasSize,
  price: merchTable.price,
  featured: merchTable.featured,
  createdAt: merchTable.createdAt,
};

export const getActiveMerch = cache(
  (): Promise<MerchRow[]> =>
    db
      .select(SELECT)
      .from(merchTable)
      .where(eq(merchTable.active, true))
      .orderBy(
        sql`${merchTable.featured} ASC NULLS LAST`,
        desc(merchTable.createdAt),
        asc(merchTable.slug),
      ),
);

export const getMerchBySlug = cache(
  async (slug: string): Promise<MerchRow | null> => {
    const [row] = await db
      .select(SELECT)
      .from(merchTable)
      .where(and(eq(merchTable.slug, slug), eq(merchTable.active, true)))
      .limit(1);
    return row ?? null;
  },
);
