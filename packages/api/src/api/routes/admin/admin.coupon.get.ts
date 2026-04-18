import { desc, eq, sql } from "drizzle-orm";
import { Elysia } from "elysia";

import { db } from "@/db";
import { couponRedemptionTable, couponTable } from "@/db/schema";
import { AdminCouponListResponseSchema } from "@/api/schemas/admin.schema";
import { SuccessResponse } from "@/api/schemas/common.schema";

export const adminCouponGetRoute = new Elysia().get(
  "/coupon",
  async () => {
    const rows = await db
      .select({
        id: couponTable.id,
        code: couponTable.code,
        discountType: couponTable.discountType,
        discountValue: couponTable.discountValue,
        maxUses: couponTable.maxUses,
        onePerUser: couponTable.onePerUser,
        active: couponTable.active,
        createdAt: couponTable.createdAt,
        updatedAt: couponTable.updatedAt,
        redemptionCount: sql<number>`count(${couponRedemptionTable.id})::int`,
      })
      .from(couponTable)
      .leftJoin(
        couponRedemptionTable,
        eq(couponRedemptionTable.couponId, couponTable.id),
      )
      .groupBy(couponTable.id)
      .orderBy(desc(couponTable.createdAt));

    return { success: true, message: { items: rows } };
  },
  { response: SuccessResponse(AdminCouponListResponseSchema) },
);
