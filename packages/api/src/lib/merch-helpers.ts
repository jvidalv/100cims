import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { cache } from "react";

import { db } from "@/db";
import { merchTable, merchVariantTable } from "@/db/schema";

export interface MerchVariant {
  color: string;
  imageUrls: string[];
}

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
  variants: MerchVariant[];
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

const loadVariantsByMerch = async (
  merchIds: string[],
): Promise<Map<string, MerchVariant[]>> => {
  const map = new Map<string, MerchVariant[]>();
  if (!merchIds.length) return map;
  const rows = await db
    .select({
      merchId: merchVariantTable.merchId,
      color: merchVariantTable.color,
      imageUrls: merchVariantTable.imageUrls,
    })
    .from(merchVariantTable)
    .where(inArray(merchVariantTable.merchId, merchIds))
    .orderBy(asc(merchVariantTable.createdAt));
  for (const r of rows) {
    const list = map.get(r.merchId) ?? [];
    list.push({ color: r.color, imageUrls: r.imageUrls });
    map.set(r.merchId, list);
  }
  return map;
};

export const getActiveMerch = cache(async (): Promise<MerchRow[]> => {
  const rows = await db
    .select(SELECT)
    .from(merchTable)
    .where(eq(merchTable.active, true))
    .orderBy(
      sql`${merchTable.featured} ASC NULLS LAST`,
      desc(merchTable.createdAt),
      asc(merchTable.slug),
    );
  const variantsByMerch = await loadVariantsByMerch(rows.map((r) => r.id));
  return rows.map((r) => ({
    ...r,
    variants: variantsByMerch.get(r.id) ?? [],
  }));
});

export const getMerchBySlug = cache(
  async (slug: string): Promise<MerchRow | null> => {
    const [row] = await db
      .select(SELECT)
      .from(merchTable)
      .where(and(eq(merchTable.slug, slug), eq(merchTable.active, true)))
      .limit(1);
    if (!row) return null;
    const variantsByMerch = await loadVariantsByMerch([row.id]);
    return { ...row, variants: variantsByMerch.get(row.id) ?? [] };
  },
);
